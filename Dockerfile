FROM node:13.6.0-alpine


LABEL org.opencontainers.image.title="Hello K3S" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/pbochynski/hello-k3s.git" 

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

USER node
CMD [ "npm", "start" ]