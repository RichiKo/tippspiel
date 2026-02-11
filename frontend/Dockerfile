FROM node:20-alpine AS build
WORKDIR /app
ENV NPM_CONFIG_USERCONFIG=/tmp/.npmrc
RUN printf "registry=https://registry.npmjs.org/\nalways-auth=false\n" > /tmp/.npmrc
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
