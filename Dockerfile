FROM node:20.11.1-slim AS build

ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /home/node/app

RUN apt-get update && apt-get install gnupg wget -y && \
  wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | tee /etc/apt/trusted.gpg.d/google.asc >/dev/null && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

RUN npm install -g @nestjs/cli

COPY package.json .
COPY package-lock.json .

RUN npm install
COPY . .

RUN npm run build

EXPOSE 3004

CMD [ "node", "start:prod" ]
