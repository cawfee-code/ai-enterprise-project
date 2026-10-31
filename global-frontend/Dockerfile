FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Expose Vite port and bind to 0.0.0.0 so it's accessible outside the container
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]