pipeline {
    agent any

    environment {
        SONAR_URL = "http://10.1.1.55:9000" 
        RECEIVER_EMAIL = "prudhviraj7675@gmail.com"
        // Replace with your Docker Hub Username
        DOCKER_USER = "prudhviraj310" 
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                echo "Scanning for vulnerabilities..."
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v "\$(pwd):/root/" ghcr.io/aquasecurity/trivy:0.69.3 fs /root/'
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
                // Use withCredentials to login to Docker Hub securely
                // Make sure you have 'docker-hub-creds' setup in Jenkins (Username/Password)
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_ID')]) {
                    sh """
                    # 1. Build the specific backend image
                    docker build -t ${DOCKER_USER}/food-app-backend:v1 ./backend
                    
                    # 2. Login to Docker Hub
                    echo \$DOCKER_PASS | docker login -u \$DOCKER_ID --password-stdin
                    
                    # 3. Push to Docker Hub
                    docker push ${DOCKER_USER}/food-app-backend:v1
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Updating Kubernetes Cluster..."
                sh """
                # Apply changes and force a rollout so K8s pulls the NEW v1 image
                kubectl apply -f k8s/backend.yaml
                kubectl rollout restart deployment food-app-backend
                """
            }
        }
    }
    
    post {
        success {
            echo "Success! Sending email..."
            mail to: "${env.RECEIVER_EMAIL}",
                 subject: "BUILD SUCCESS: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                 body: "The Jenkins pipeline for 'food-app' finished successfully and deployed to K8s!"
        }
        failure {
            echo "Failure! Sending alert..."
            mail to: "${env.RECEIVER_EMAIL}",
                 subject: "BUILD FAILED: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                 body: "The Jenkins pipeline has FAILED. Check logs: ${env.BUILD_URL}console"
        }
    }
}