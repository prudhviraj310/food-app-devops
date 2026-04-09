pipeline {
    agent any

    environment {
        SONAR_URL = "http://10.1.1.55:9000" 
        RECEIVER_EMAIL = "prudhviraj7675@gmail.com"
        DOCKER_USER = "prudhviraj310" 
        K8S_MASTER = "https://10.1.1.118:6443"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                echo "Scanning entire project for vulnerabilities..."
                // FIXED: Using ${WORKSPACE} ensures Docker mounts the actual Jenkins folder
                sh "docker run --rm --network host -v /var/run/docker.sock:/var/run/docker.sock -v ${WORKSPACE}:/root ghcr.io/aquasecurity/trivy:0.69.3 fs /root"
            }
        }

        stage('Static Analysis (SonarQube)') {
            steps {
                echo "Analyzing code quality..."
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh """
                    chmod -R 777 .

                    # FIXED: Mounting ${WORKSPACE} to /usr/src so the scanner finds your files
                    docker run --rm --user root \
                        --network host \
                        -v "${WORKSPACE}:/usr/src" \
                        sonarsource/sonar-scanner-cli \
                        -Dsonar.projectKey=food-app-fullstack \
                        -Dsonar.sources=/usr/src \
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
                    
                    docker build -t ${DOCKER_USER}/food-app-backend:v1 ./backend
                    docker push ${DOCKER_USER}/food-app-backend:v1
                    
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
                [ -f /var/jenkins_home/.kube/config ] && chmod 644 /var/jenkins_home/.kube/config
                export KUBECONFIG=/var/jenkins_home/.kube/config
                
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/db.yaml
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/backend.yaml
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/frontend.yaml
                
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true rollout restart deployment food-app-backend
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true rollout restart deployment food-app-frontend
                """
            }
        }
    }

    post {
        success {
            echo "Deployment Successful! Check your apps at port 30007 and 30008."
        }
        failure {
            echo "Pipeline Failed. Review the Console Output for indexing errors."
        }
    }
}