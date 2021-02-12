export VERSION=$(cat app/package.json| jq -r '.version')
docker build -f Dockerfile -t registry.localhost:5000/pbochynski/hello-k3s:$VERSION \
  --cache-from ghcr.io/pbochynski/hello-k3s:0.1.1 \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  app 
docker push registry.localhost:5000/pbochynski/hello-k3s:$VERSION
