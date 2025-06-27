## Delete all pods

## Start from scratch

1. 
```
kubectl delete daemonsets,replicasets,services,deployments,pods,rc,ingress --all --all-namespaces

или

kubectl delete deployment backend frontend mongo
```

2. Убить все процессы minikube (tunnel, dashboard, etc.)
3. Удалить все контейнеры, образы, сборки, тома

## Add pods

```
kubectl apply -f mongo-pvc.yaml
kubectl apply -f mongo-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

kubectl apply -f .
```

```
eval $(minikube docker-env)
```

```
kubectl get pods
kubectl describe pod my-pod-name

docker image ls
minikube image ls
minikube image load <image-name>
```

```
kubectl port-forward svc/frontend-service 3000:3000

minikube tunnel
minikube addons enable ingress
```

Зайти в командную строку контейнера внутри k8s
```
kubectl exec --stdin --tty frontend-74db8b5df6-mlr8q -- /bin/sh
```

Обновить /etc/hosts в ОС
```
echo -e "127.0.0.1 frontend.localhost\n127.0.0.1 backend.localhost" | sudo tee -a /etc/hosts
```

```
kubectl logs deployment/backend-deployment
```