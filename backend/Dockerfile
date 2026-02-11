FROM node:20-alpine AS build
WORKDIR /app
ENV NPM_CONFIG_USERCONFIG=/tmp/.npmrc
RUN printf "registry=https://registry.npmjs.org/\nalways-auth=false\n" > /tmp/.npmrc
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NPM_CONFIG_USERCONFIG=/tmp/.npmrc
RUN printf "registry=https://registry.npmjs.org/\nalways-auth=false\n" > /tmp/.npmrc
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
RUN mkdir -p ./uploads/teams ./uploads/users ./uploads/championships
EXPOSE 3000
CMD ["node", "dist/main"]
