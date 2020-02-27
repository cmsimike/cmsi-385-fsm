FROM node:12.4
COPY package*.json ./
RUN npm install -g yarn
RUN yarn
COPY . .
CMD ["yarn", "test"]
