FROM node:24-alpine
WORKDIR /app
COPY  user_microservice/package*.json ./
RUN   npm ci --omit=dev --legacy-peer-deps
COPY  user_microservice/src ./src
COPY  user_microservice/openapi.yaml ./

# copy proto files into app/proto 
COPY proto ./proto
COPY user_microservice/drizzle ./drizzle

EXPOSE 3000
CMD ["node", "src/server.ts"]
