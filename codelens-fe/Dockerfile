FROM node:20-alpine AS build

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy the package.json and package-lock.json
COPY package*.json ./

# Step 4: Install dependencies with npm ci
RUN npm install --silent

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Build the React app for production
RUN npm run build

FROM node:20-alpine AS production

# Step 7: Set the working directory inside the container
WORKDIR /app

# Step 8: Copy the built app from the build stage
COPY --from=build /app/build ./build

# Step 9: Install a web server (e.g., Nginx or serve) to serve the built app
RUN npm install -g serve --silent

# Step 10: Expose the port to serve the React app (default is 3000)
EXPOSE 3000

# Step 11: Serve the React app
CMD ["serve", "-s", "build", "-l", "3000"]