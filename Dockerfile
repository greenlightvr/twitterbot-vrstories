FROM dockerfile/nodejs

COPY . /app

WORKDIR /app

RUN \
  rm -rf node_modules .env log && \
  npm install --production

ENV NODE_ENV production
ENV LOG_NAME twitterbot-vrstories

CMD ["npm", "start"]