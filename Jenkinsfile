pipeline {
    agent any

    stages {
        stage('Clone') {
            steps {
                echo "Add your repo URL here"
            }
        }

        stage('Build') {
            steps {
                sh 'docker-compose build'
            }
        }

        stage('Run') {
            steps {
                sh 'docker-compose up -d'
            }
        }
    }
}
