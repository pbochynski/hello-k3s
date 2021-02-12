export VERSION=$(cat app/package.json| jq -r '.version')
docker build -f Dockerfile -t registry.localhost:5000/pbochynski/hello-k3s:$VERSION app
docker push registry.localhost:5000/pbochynski/hello-k3s:$VERSION
