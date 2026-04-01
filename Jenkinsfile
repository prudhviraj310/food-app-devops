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
        // Switching to GitHub Container Registry since Docker Hub is under quarantine
        sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/aquasecurity/trivy:0.69.3 fs .'
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