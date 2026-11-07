# 译境 TransVerse — CloudBase 云托管镜像
# 业务代码零改动：直接运行现有 server.js

FROM node:18-alpine

# CloudBase 云托管要求容器监听 0.0.0.0 上的指定端口（默认 80）
# server.js 已优先读取 process.env.PORT，无需改代码
ENV NODE_ENV=production
ENV PORT=80

WORKDIR /app

# 先装依赖（利用 Docker 层缓存；使用腾讯云镜像源加速国内构建）
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --registry=https://mirrors.cloud.tencent.com/npm/ || \
    npm install --omit=dev --registry=https://mirrors.cloud.tencent.com/npm/

# 再拷贝业务代码（.dockerignore 已排除 .env / node_modules / .git）
COPY . .

EXPOSE 80

CMD ["node", "server.js"]
