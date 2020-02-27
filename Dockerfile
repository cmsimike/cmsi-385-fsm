FROM node:12.4

COPY . .

RUN npm install -g yarn
RUN yarn
CMD ["yarn", "test"]
