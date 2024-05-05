# Palworld-supabase-realtime-backend docker-compose
Node backend for palworld server with supabase-realtime on docker

# Palworld Dedicated Server Docker 
https://github.com/thijsvanloef/palworld-server-docker

# Docker-Compose
sudo docker-compose up -d --build

# Command
## Nodejs
npm init -y
npm install typescript ts-node @types/node --save-dev
npx tsc --init

## Prisma
npm install @prisma/client
npm install prisma --save-dev
npx prisma init --datasource-provider sqlite

npx prisma migrate dev --name init

npx prisma migrate dev --create-only
npx prisma migrate dev

npx prisma migrate reset
npx prisma generate

## Reset id & data for supabase
TRUNCATE TABLE realtime_systeminfo RESTART IDENTITY;

## Clear logs in docker in linux
sudo sh -c "truncate -s 0 /var/lib/docker/containers/**/*-json.log"
