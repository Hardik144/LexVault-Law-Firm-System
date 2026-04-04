FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --only=production

COPY . .
RUN npx prisma generate
RUN mkdir -p uploads
RUN chmod +x entrypoint.sh

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=10s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:5000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
