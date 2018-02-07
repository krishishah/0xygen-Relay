FROM node:9.3.0
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
COPY ./tsconfig.json /usr/src/app
COPY ./gulpfile.js /usr/src/app
RUN npm install
COPY . /usr/src/app
EXPOSE 3000
CMD [ "npm", "run", "build" ]
CMD [ "npm", "start" ]