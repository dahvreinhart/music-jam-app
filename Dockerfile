FROM node:13.8.0-alpine3.11

RUN mkdir -p /src
RUN npm install express-generator -g
RUN npm install nodemon -g

WORKDIR /src
ADD jam-app/package.json /src/package.json
RUN npm install

EXPOSE 3000
CMD ["nodemon", "--legacy-watch", "jam-app/bin/www"]