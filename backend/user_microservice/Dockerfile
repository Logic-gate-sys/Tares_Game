FROM node:24-alpine
WORKDIR /app
COPY  backend/user_microservice/package*.json ./
COPY  backend/user_microservice/.env.test  ./
COPY  backend/user_microservice/.env  ./
RUN   npm ci --omit=dev --legacy-peer-deps
COPY  backend/user_microservice/src ./src
COPY  backend/user_microservice/openapi.yaml ./

# copy proto files into app/proto 
COPY proto   ./proto
COPY backend/user_microservice/drizzle ./drizzle

EXPOSE 3000
CMD ["npm", "run", "dev"]
