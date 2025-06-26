## Prerequisites

`kubectl` and `minikube` must be installed

## K8s

1. `minikube start`
2. `minikube addons enable ingress` (аддон нужен для роутинга внутри кластера + для доступа к подам извне)
3. `minikube dashboard` (запускаем дашбоард)
4. `minikube tunnel` (запускает тоннель, чтобы к подам можно было стучаться извне)
5. `docker-compose build`
6. move images inside minikube
   1. `docker image ls`
   2. `minikube image ls`
   3. `minikube image load deployment-risks-frontend`
   4. `minikube image load deployment-risks-backend`
   5. `minikube image load deployment-risks-pdf-worker`
   6. `minikube image load mongo`
   7. `minikube image load redis`
7. `kubectl apply -f .` (одной командой запускаем все yaml-файлы для k8s)
   1. `kubectl apply -f mongo-deployment.yaml && kubectl apply -f mongo-service.yaml && kubectl apply -f mongo-pvc.yaml`
   2. `kubectl apply -f redis-deployment.yaml && kubectl apply -f redis-service.yaml`
   3. `kubectl apply -f pdf-storage-pvc.yaml && kubectl apply -f pdf-worker-deployment.yaml`
   4. `kubectl apply -f backend-deployment.yaml && kubectl apply -f backend-service.yaml && kubectl apply -f backend-ingress.yaml`
   5. `kubectl apply -f frontend-deployment.yaml && kubectl apply -f frontend-service.yaml && kubectl apply -f frontend-ingress.yaml`
8. `echo -e "127.0.0.1 frontend.localhost\n127.0.0.1 backend.localhost" | sudo tee -a /etc/hosts` (обновляем `/etc/hosts`, чтобы стучаться к подам извне)


```
# load all images with one command
minikube image load deployment-risks-frontend && minikube image load deployment-risks-backend && minikube image load deployment-risks-pdf-worker && minikube image load mongo && minikube image load redis 
```