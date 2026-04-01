pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                // This uses the Trivy installed on the host via the docker socket
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest fs .'
            }
        }

        stage('Build') {
            steps {
                // Use "docker compose" (space) instead of "docker-compose" (hyphen)
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }
    
    post {
        success {
            echo "Deployment successful!"
        }
        failure {
            echo "Build failed. Check the logs."
        }
    }
}