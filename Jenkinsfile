pipeline {
    agent any

    environment {
        // Infrastructure Details
        SONAR_URL = "http://10.1.1.55:9000" 
        RECEIVER_EMAIL = "prudhviraj7675@gmail.com"
        DOCKER_USER = "prudhviraj310" 
        K8S_MASTER = "https://10.1.1.118:6443"
    }

    stages {
        stage('Checkout') {
            steps {
                // Pulls code from the GitHub repo you linked in the Job
                checkout scm
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                echo "Scanning for vulnerabilities..."
                // Runs Trivy as a container to scan the current directory
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v "$(pwd):/root/" ghcr.io/aquasecurity/trivy:0.69.3 fs /root/'
            }
        }

        stage('Static Analysis (SonarQube)') {
            steps {
                echo "Analyzing code quality on ${env.SONAR_URL}..."
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh """
                    docker run --rm --user root \
                        -v "\$(pwd):/usr/src" \
                        sonarsource/sonar-scanner-cli \
                        -Dsonar.projectKey=food-app \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=${env.SONAR_URL} \
                        -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Build & Push') {
            steps {
                echo "Building and Pushing Docker images..."
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_ID')]) {
                    sh """
                    # Build the image using the DOCKER_USER variable
                    docker build -t ${DOCKER_USER}/food-app-backend:v1 ./backend
                    
                    # Login and Push to Docker Hub
                    echo \$DOCKER_PASS | docker login -u \$DOCKER_ID --password-stdin
                    docker push ${DOCKER_USER}/food-app-backend:v1
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Updating Kubernetes Cluster..."
                sh """
                # 1. Access the Kubeconfig we mounted in Docker Compose
                # We use /var/jenkins_home/ because that is the path inside the container
                [ -f /var/jenkins_home/.kube/config ] && chmod 644 /var/jenkins_home/.kube/config
                export KUBECONFIG=/var/jenkins_home/.kube/config
                
                # 2. Deploy to the K8s Master IP
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/backend.yaml
                
                # 3. Force a restart to pull the new image
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true rollout restart deployment food-app-backend
                """
            }
        }
    }
    
    post {
        success {
            echo "Success! Sending email..."
            script {
                try {
                    mail to: "${env.RECEIVER_EMAIL}",
                         subject: "BUILD SUCCESS: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                         body: "The Jenkins pipeline for 'food-app' finished successfully and updated the cluster!"
                } catch (Exception e) {
                    echo "Mail notification failed, but the deployment was successful!"
                }
            }
        }
        failure {
            echo "Failure! Sending alert..."
            script {
                try {
                    mail to: "${env.RECEIVER_EMAIL}",
                         subject: "BUILD FAILED: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                         body: "The Jenkins pipeline has FAILED. Check logs: ${env.BUILD_URL}console"
                } catch (Exception e) {
                    echo "Mail notification failed. Check Jenkins logs manually."
                }
            }
        }
    }
}