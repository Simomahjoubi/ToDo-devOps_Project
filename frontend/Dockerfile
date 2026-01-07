FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
# Sur Vite, le dossier est 'dist'. Sur Create React App, c'est 'build'.
COPY --from=build /app/dist /usr/share/nginx/html
# On ajoute une config Nginx pour gérer les routes React si besoin
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]