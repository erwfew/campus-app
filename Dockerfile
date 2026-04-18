FROM node:18-slim

WORKDIR /app

# 先装 server 依赖
COPY server/package*.json server/
RUN cd server && npm install --production

# 复制全部代码
COPY . .

# 跳过 Puppeteer 下载
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app/server

EXPOSE 3000

CMD ["node", "app.js"]
