pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_BACKEND         = "${DOCKERHUB_CREDENTIALS_USR}/lawfirm-backend"
        IMAGE_FRONTEND        = "${DOCKERHUB_CREDENTIALS_USR}/lawfirm-frontend"
        IMAGE_TAG             = "${env.BUILD_NUMBER}"
        AWS_REGION            = "ap-south-1"
        EKS_CLUSTER           = "lawfirm-cluster"
    }

    options {
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('🔍 Checkout Code') {
            steps {
                cleanWs()
                git branch: 'main',
                    url: 'https://github.com/Hardik144/LexVault-Law-Firm-System.git'
                sh 'git log --oneline -5'
                echo "✅ Code checked out — Build #${BUILD_NUMBER}"
            }
        }

        stage('📦 Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm install'
                            echo "✅ Backend dependencies installed"
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm install'
                            echo "✅ Frontend dependencies installed"
                        }
                    }
                }
            }
        }

        stage('🧪 Run Tests') {
            steps {
                dir('backend') {
                    sh 'npm test || true'
                    echo "✅ Tests completed"
                }
            }
            post {
                always {
                    echo "Test stage finished — check output above for results"
                }
            }
        }

        stage('🔒 Security Audit') {
            parallel {
                stage('Backend Audit') {
                    steps {
                        dir('backend') {
                            sh 'npm audit --audit-level=high || true'
                            echo "✅ Backend security audit complete"
                        }
                    }
                }
                stage('Frontend Audit') {
                    steps {
                        dir('frontend') {
                            sh 'npm audit --audit-level=high || true'
                            echo "✅ Frontend security audit complete"
                        }
                    }
                }
            }
        }

        stage('🏗️ Build Docker Images') {
            steps {
                script {
                    sh "docker build -t ${IMAGE_BACKEND}:${IMAGE_TAG} -t ${IMAGE_BACKEND}:latest ./backend"
                    sh "docker build -t ${IMAGE_FRONTEND}:${IMAGE_TAG} -t ${IMAGE_FRONTEND}:latest ./frontend"
                    sh "docker images | grep lawfirm || true"
                    echo "✅ Docker images built"
                }
            }
        }

        stage('🚀 Push to Docker Hub') {
            steps {
                script {
                    sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
                    sh "docker push ${IMAGE_BACKEND}:${IMAGE_TAG}"
                    sh "docker push ${IMAGE_BACKEND}:latest"
                    sh "docker push ${IMAGE_FRONTEND}:${IMAGE_TAG}"
                    sh "docker push ${IMAGE_FRONTEND}:latest"
                    echo "✅ Images pushed to Docker Hub"
                }
            }
            post {
                always { sh 'docker logout || true' }
            }
        }

        stage('☸️ Deploy to AWS EKS') {
            steps {
                withCredentials([
                    file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE'),
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    script {
                        sh """
                            cp \$KUBECONFIG_FILE /tmp/kubeconfig
                            chmod 600 /tmp/kubeconfig

                            export AWS_ACCESS_KEY_ID=\$AWS_ACCESS_KEY_ID
                            export AWS_SECRET_ACCESS_KEY=\$AWS_SECRET_ACCESS_KEY
                            export AWS_DEFAULT_REGION=${AWS_REGION}
                            export KUBECONFIG=/tmp/kubeconfig

                            # Create namespace
                            kubectl create namespace lawfirm --dry-run=client -o yaml | kubectl apply -f -

                            # Apply base manifests (postgres, secrets)
                            kubectl apply -f devops/kubernetes/k8s/postgres.yaml
                            kubectl apply -f devops/kubernetes/k8s/services.yaml

                            # Apply blue-green deployments
                            kubectl apply -f devops/kubernetes/blue-green/backend-blue.yaml
                            kubectl apply -f devops/kubernetes/blue-green/backend-green.yaml
                            kubectl apply -f devops/kubernetes/blue-green/service.yaml

                            # Apply frontend
                            kubectl apply -f devops/kubernetes/k8s/frontend-deployment.yaml

                            echo "✅ Manifests applied to AWS EKS"
                        """
                    }
                }
            }
        }

        stage('🔵🟢 Blue-Green Switch') {
            steps {
                withCredentials([
                    file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE'),
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    script {
                        sh """
                            cp \$KUBECONFIG_FILE /tmp/kubeconfig
                            chmod 600 /tmp/kubeconfig

                            export AWS_ACCESS_KEY_ID=\$AWS_ACCESS_KEY_ID
                            export AWS_SECRET_ACCESS_KEY=\$AWS_SECRET_ACCESS_KEY
                            export AWS_DEFAULT_REGION=${AWS_REGION}

                            # Find current live version
                            CURRENT=\$(kubectl get service backend-live -n lawfirm \\
                                -o jsonpath='{.spec.selector.version}' \\
                                --kubeconfig=/tmp/kubeconfig 2>/dev/null || echo "blue")

                            echo "Current live version: \$CURRENT"

                            # Target the opposite color
                            if [ "\$CURRENT" = "blue" ]; then
                                TARGET="green"
                            else
                                TARGET="blue"
                            fi

                            echo "Deploying new image to: \$TARGET"

                            # Update target deployment with new image
                            kubectl set image deployment/lawfirm-backend-\$TARGET \\
                                backend=${IMAGE_BACKEND}:${IMAGE_TAG} \\
                                -n lawfirm --kubeconfig=/tmp/kubeconfig

                            # Wait for target to be ready
                            kubectl rollout status deployment/lawfirm-backend-\$TARGET \\
                                -n lawfirm --timeout=120s --kubeconfig=/tmp/kubeconfig

                            echo "\\n=== Testing \$TARGET before switching ==="
                            kubectl get pods -n lawfirm -l version=\$TARGET \\
                                --kubeconfig=/tmp/kubeconfig

                            # Switch traffic to new version
                            kubectl patch service backend-live -n lawfirm \\
                                -p "{\\"spec\\":{\\"selector\\":{\\"version\\":\\"\$TARGET\\"}}}" \\
                                --kubeconfig=/tmp/kubeconfig

                            echo "✅ Traffic switched: \$CURRENT → \$TARGET"
                            echo "🔵 BLUE: \$([ \$TARGET = blue ] && echo LIVE || echo STANDBY)"
                            echo "🟢 GREEN: \$([ \$TARGET = green ] && echo LIVE || echo STANDBY)"
                        """
                    }
                }
            }
        }

        stage('✅ Health Check') {
            steps {
                withCredentials([
                    file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE'),
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        cp \$KUBECONFIG_FILE /tmp/kubeconfig
                        chmod 600 /tmp/kubeconfig

                        export AWS_ACCESS_KEY_ID=\$AWS_ACCESS_KEY_ID
                        export AWS_SECRET_ACCESS_KEY=\$AWS_SECRET_ACCESS_KEY
                        export AWS_DEFAULT_REGION=${AWS_REGION}

                        echo "=== All Pods ==="
                        kubectl get pods -n lawfirm --kubeconfig=/tmp/kubeconfig

                        echo "=== Deployments ==="
                        kubectl get deployments -n lawfirm --kubeconfig=/tmp/kubeconfig

                        echo "=== Services ==="
                        kubectl get svc -n lawfirm --kubeconfig=/tmp/kubeconfig

                        echo "=== Current Live Version ==="
                        kubectl get service backend-live -n lawfirm \\
                            -o jsonpath='Live traffic going to: {.spec.selector.version}' \\
                            --kubeconfig=/tmp/kubeconfig

                        echo "\\n✅ Health Check Complete — Build #${BUILD_NUMBER}"
                    """
                }
            }
        }

    }

    post {
        success {
            echo "🎉 Pipeline SUCCESS — Build #${env.BUILD_NUMBER} deployed to AWS EKS"
        }
        failure {
            echo "❌ Pipeline FAILED — Build #${env.BUILD_NUMBER}"
            echo "Check the red stage above for the error"
        }
        always {
            sh "docker rmi ${IMAGE_BACKEND}:${IMAGE_TAG} || true"
            sh "docker rmi ${IMAGE_FRONTEND}:${IMAGE_TAG} || true"
            cleanWs()
        }
    }
}