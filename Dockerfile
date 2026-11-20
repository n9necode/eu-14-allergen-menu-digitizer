FROM apify/actor-node:20

# Install poppler-utils for PDF processing
# Alpine Linux uses apk, not apt-get
RUN apk update && apk add --no-cache poppler-utils

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set default command
CMD ["npm", "start"]