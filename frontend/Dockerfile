FROM node:20-alpine AS build
WORKDIR /app
ENV NPM_CONFIG_USERCONFIG=/tmp/.npmrc \
    NPM_CONFIG_GLOBALCONFIG=/tmp/.npmrc-global \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_ALWAYS_AUTH=false
RUN printf "registry=https://registry.npmjs.org/\nalways-auth=false\n@angular:registry=https://registry.npmjs.org/\n@angular-devkit:registry=https://registry.npmjs.org/\n" > /tmp/.npmrc \
    && : > /tmp/.npmrc-global
COPY package*.json ./
RUN env -i PATH="$PATH" HOME="$HOME" \
    NPM_CONFIG_USERCONFIG=/tmp/.npmrc \
    NPM_CONFIG_GLOBALCONFIG=/tmp/.npmrc-global \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_ALWAYS_AUTH=false \
    npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/frontend/browser/. /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
