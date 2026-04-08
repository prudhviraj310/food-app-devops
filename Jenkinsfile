pipeline {
    agent any

    environment {
        // Updated with your new SonarQube IP
        SONAR_URL = "http://13.201.51.53:9000" 
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
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v "$(pwd):/root/" ghcr.io/aquasecurity/trivy:0.69.3 fs /root/'
            }
        }

        stage('Static Analysis (SonarQube)') {
            steps {
                echo "Analyzing code quality..."
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh """
                    docker run --rm --user root \
                        -v "\$(pwd):/usr/src" \
                        sonarsource/sonar-scanner-cli \
                        -Dsonar.projectKey=food-app-fullstack \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=${env.SONAR_URL} \
                        -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Build & Push Images') {
            steps {
                echo "Building Backend and Frontend images..."
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_ID')]) {
                    sh """
                    # Login once
                    echo \$DOCKER_PASS | docker login -u \$DOCKER_ID --password-stdin

                    # 1. Build and Push Backend
                    docker build -t ${DOCKER_USER}/food-app-backend:v1 ./backend
                    docker push ${DOCKER_USER}/food-app-backend:v1

                    # 2. Build and Push Frontend
                    docker build -t ${DOCKER_USER}/food-app-frontend:v1 ./frontend
                    docker push ${DOCKER_USER}/food-app-frontend:v1
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Updating Database, Backend, and Frontend in Cluster..."
                sh """
                # Set permissions and path for Kubeconfig
                [ -f /var/jenkins_home/.kube/config ] && chmod 644 /var/jenkins_home/.kube/config
                export KUBECONFIG=/var/jenkins_home/.kube/config
                
                # Apply all YAML files (Database, Backend, Frontend)
                # Assumes your files are named correctly in the k8s folder
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/db.yaml
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/backend.yaml
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/frontend.yaml
                
                # Force restart for Backend and Frontend to use latest :v1 images
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true rollout restart deployment food-app-backend
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true rollout restart deployment food-app-frontend
                """
            }
        }
    }
    
    post {
        success {
            echo "Full Stack Deployment Successful!"
            script {
                try {
                    mail to: "${env.RECEIVER_EMAIL}",
                         subject: "FULL DEPLOY SUCCESS: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                         body: "Everything is live! Database, Backend, and Frontend have been updated."
                } catch (Exception e) {
                    echo "Mail failed, but deployment worked."
                }
            }
        }
        failure {
            echo "Pipeline Failed. Check logs."
            script {
                try {
                    mail to: "${env.RECEIVER_EMAIL}",
                         subject: "DEPLOY FAILED: ${env.JOB_NAME}",
                         body: "Check the console output here: ${env.BUILD_URL}console"
                } catch (Exception e) {
                    echo "Mail notification failed."
                }
            }
        }
    }
}