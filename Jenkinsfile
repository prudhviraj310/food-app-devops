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
                echo "Scanning for vulnerabilities..."
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
                    # Build backend image
                    docker build -t ${DOCKER_USER}/food-app-backend:v1 ./backend
                    
                    # Login to Docker Hub
                    echo \$DOCKER_PASS | docker login -u \$DOCKER_ID --password-stdin
                    
                    # Push image
                    docker push ${DOCKER_USER}/food-app-backend:v1
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Updating Kubernetes Cluster..."
                sh """
                # Step 1: Force correct permissions on the mounted config
                # This bypasses the 'Permission Denied' issue inside the pipeline environment
                [ -f /root/.kube/config ] && chmod 644 /root/.kube/config
                
                # Step 2: Set the Kubeconfig path
                export KUBECONFIG=/root/.kube/config
                
                # Step 3: Execute deployment
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true apply -f k8s/backend.yaml
                kubectl --server=${K8S_MASTER} --insecure-skip-tls-verify=true rollout restart deployment food-app-backend
                """
            }
        }
    }
    
    post {
        success {
            echo "Success! Sending email..."
            mail to: "${env.RECEIVER_EMAIL}",
                 subject: "BUILD SUCCESS: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                 body: "The Jenkins pipeline for 'food-app' finished successfully and updated the cluster!"
        }
        failure {
            echo "Failure! Sending alert..."
            mail to: "${env.RECEIVER_EMAIL}",
                 subject: "BUILD FAILED: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                 body: "The Jenkins pipeline has FAILED. Check logs: ${env.BUILD_URL}console"
        }
    }
}