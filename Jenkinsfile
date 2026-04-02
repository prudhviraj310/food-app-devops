pipeline {
    agent any

    environment {
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
                // Added \ before $(pwd) to fix the Groovy error
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
            echo "Success! Sending email..."
            mail to: "${env.RECEIVER_EMAIL}",
                 subject: "BUILD SUCCESS: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                 body: "The Jenkins pipeline for 'food-app' finished successfully!"
        }
        failure {
            echo "Failure! Sending alert..."
            mail to: "${env.RECEIVER_EMAIL}",
                 subject: "BUILD FAILED: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                 body: "The Jenkins pipeline has FAILED. Check logs: ${env.BUILD_URL}console"
        }
    }
}