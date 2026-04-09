pipeline {
    agent any

    environment {
        // Ensure these IPs match your current EC2 instances
        SONAR_URL = "http://10.1.1.55:9000" 
        RECEIVER_EMAIL = "prudhviraj7675@gmail.com"
        DOCKER_USER = "prudhviraj310" 
        K8S_MASTER = "https://10.1.1.118:6443"
    }

    stages {
        stage('Checkout') {
            steps {
                // Pulls the latest code from your GitHub repository
                checkout scm
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                echo "Scanning entire project for vulnerabilities..."
                // FIX: Double quotes and \$(pwd) prevent 'Bad Substitution' errors
                sh "docker run --rm --network host -v /var/run/docker.sock:/var/run/docker.sock -v \$(pwd):/root ghcr.io/aquasecurity/trivy:0.69.3 fs /root"
            }
        }

        stage('Static Analysis (SonarQube)') {
            steps {
                echo "Analyzing code quality..."
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh """
                    # Ensure the scanner has permission to read the workspace
                    chmod -R 777 .

                    docker run --rm --user root \
                        --network host \
                        -v "\$(pwd):/usr/src" \
                        sonarsource/sonar-scanner-cli \
                        -Dsonar.projectKey=food-app-fullstack \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=${env.SONAR_URL} \
                        -Dsonar.login=${SONAR_TOKEN} \
                        -Dsonar.scm.disabled=true
                    """
                }
            }
        }

        stage('Build & Push Images') {
            steps {
                echo "Building and Pushing Docker images..."
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_ID')]) {
                    sh """
                    echo \$DOCKER_PASS | docker login -u \$DOCKER_ID --password-stdin
                    
                    # Build and push Backend
                    docker build -t ${DOCKER_USER}/food-app-backend:v1 ./backend
                    docker push ${DOCKER_USER}/food-app-backend:v1
                    
                    # Build and push Frontend
                    docker build -t ${DOCKER_USER}/food-app-frontend:v1 ./frontend
                    docker push ${DOCKER_USER}/food-app-frontend:v1
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Deploying to Kubernetes Cluster..."
                sh """
                # Set permissions for kubeconfig if it exists in Jenkins home
                [ -f /var/jenkins_home/.kube/config ] && chmod 644 /var/jenkins_home/.kube/config
                export KUBECONFIG=/var/jenkins_home/.kube/config
                
                # Apply Kubernetes YAML files (ensure backend.yaml has NodePort 30008)
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/db.yaml
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/backend.yaml
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/frontend.yaml
                
                # Rollout restart ensures pods pull the 'v1' image again if it was updated
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true rollout restart deployment food-app-backend
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true rollout restart deployment food-app-frontend
                """
            }
        }
    }

    post {
        success {
            echo "Successfully Deployed! Access Frontend at http://65.2.188.210:30007"
        }
        failure {
            echo "Pipeline Failed. Please check the logs for the failed stage."
        }
    }
}