FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# For Prisma
RUN npx prisma generate 
RUN npm run build
EXPOSE 5001
CMD ["node", "./dist/index.js"]