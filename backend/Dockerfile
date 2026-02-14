FROM node:20-alpine AS build
WORKDIR /app
ENV NPM_CONFIG_USERCONFIG=/tmp/.npmrc \
    NPM_CONFIG_GLOBALCONFIG=/tmp/.npmrc-global \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_ALWAYS_AUTH=false
RUN printf "registry=https://registry.npmjs.org/\nalways-auth=false\n" > /tmp/.npmrc \
    && : > /tmp/.npmrc-global
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NPM_CONFIG_USERCONFIG=/tmp/.npmrc \
    NPM_CONFIG_GLOBALCONFIG=/tmp/.npmrc-global \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_ALWAYS_AUTH=false
RUN printf "registry=https://registry.npmjs.org/\nalways-auth=false\n" > /tmp/.npmrc \
    && : > /tmp/.npmrc-global
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
RUN mkdir -p ./uploads/teams ./uploads/users ./uploads/championships
EXPOSE 3000
CMD ["node", "dist/main"]
