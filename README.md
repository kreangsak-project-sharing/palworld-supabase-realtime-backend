# Palworld-supabase-realtime-backend
Node backend for palworld server with supabase-realtime on docker

# Palworld Dedicated Server Docker 
https://github.com/thijsvanloef/palworld-server-docker

# Docker-Compose
sudo docker-compose up -d --build

# Command
## Nodejs
```
npm init -y
npm install -D typescript @types/node ts-node
npx tsc --init

npm i dotenv express nodemon
npm i -D @types/express
```

## package.json
```
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "build": "npx tsc",
    "start": "node ./dist/index.js",
    "dev": "nodemon index.ts"
  },
```

## tsconfig.json
```
"rootDir": "./"
"allowJs": true
"outDir": "./dist"
```

## Prisma
```
npm install @prisma/client
npm install prisma --save-dev
npx prisma init --datasource-provider sqlite
npx prisma migrate dev --name init
npx prisma migrate dev --create-only
npx prisma migrate dev
npx prisma migrate reset
npx prisma generate
```

## Reset id & data for supabase
```
TRUNCATE TABLE realtime_systeminfo RESTART IDENTITY;
```

## Clear logs in docker in linux
```
sudo sh -c "truncate -s 0 /var/lib/docker/containers/**/*-json.log"
```

# Using Custom Schemas for supabase
```
GRANT USAGE ON SCHEMA myschema TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA myschema TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA myschema TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA myschema TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA myschema GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA myschema GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA myschema GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
```
# Initialize the Supabase JS client
```
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'myschema' } })
```
# Make a request
```
const { data: todos, error } = await supabase.from('todos').select('*')
```
