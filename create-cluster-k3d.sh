#!/bin/bash
set -o errexit

# Create docker network
docker network create hello || echo "hello network already exists"

# Start docker Registry
docker run -d \
  -p 5000:5000 \
  --restart=always \
  --name registry.localhost \
  --network hello \
  -v $PWD/registry:/var/lib/registry \
  -e REGISTRY_STORAGE_DELETE_ENABLED=true \
  eu.gcr.io/kyma-project/test-infra/docker-registry-2:20200202

# Create Kyma cluster
k3d cluster create hello \
    --image "docker.io/rancher/k3s:v1.19.7-k3s1" \
    --port 80:80@loadbalancer \
    --port 443:443@loadbalancer \
    --k3s-server-arg --no-deploy \
    --k3s-server-arg traefik \
    --network hello \
    --volume $PWD/registries.yaml:/etc/rancher/k3s/registries.yaml \
    --wait \
    --kubeconfig-switch-context \
    --timeout 60s 

echo "Cluster created in $(( $SECONDS/60 )) min $(( $SECONDS % 60 )) sec"
