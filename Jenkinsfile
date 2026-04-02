pipeline {
    agent any

    environment {
        // Using your Private IP for internal EC2 communication
        SONAR_URL = "http://10.1.1.55:9000" 
        RECEIVER_EMAIL = "prudhviraj7675@gmail.com"
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
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/aquasecurity/trivy:0.69.3 fs .'
            }
        }

        stage('Static Analysis (SonarQube)') {
            steps {
                echo "Analyzing code quality on ${env.SONAR_URL}..."
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh """
                    docker run --rm  --user root -v "${WORKSPACE}:/usr/src" sonarsource/sonar-scanner-cli \
                        -Dsonar.projectKey=food-app \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=${SONAR_URL} \
                        -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Build') {
            steps {
                echo "Building Docker containers..."
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            steps {
                echo "Launching application..."
                sh 'docker compose up -d'
            }
        }
    }
    
    post {
        success {
            echo "Success! Sending email to ${env.RECEIVER_EMAIL}..."
            mail to: "${env.RECEIVER_EMAIL}",
                 subject: "BUILD SUCCESS: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                 body: """Hello Prudhviraj,
                 
The Jenkins pipeline for 'food-app' finished successfully!

Build Details:
- Number: ${env.BUILD_NUMBER}
- Status: SUCCESS
- Log Link: ${env.BUILD_URL}

Access your app at: http://<YOUR-PUBLIC-IP>:3000
Check SonarQube at: http://<YOUR-PUBLIC-IP>:9000
"""
        }
        failure {
            echo "Failure! Sending alert to ${env.RECEIVER_EMAIL}..."
            mail to: "${env.RECEIVER_EMAIL}",
                 subject: "BUILD FAILED: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                 body: """Hello Prudhviraj,
                 
The Jenkins pipeline has FAILED. 

Please check the error logs: ${env.BUILD_URL}console
"""
        }
    }
}