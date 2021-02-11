# This will delete the cluster and the docker registry
k3d cluster delete hello
docker rm -f  registry.localhost
docker network rm hello