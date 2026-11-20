# Apify Actor base image with Node 20
FROM apify/actor-node:20

# PDF rendering support: poppler-utils (pdftoppm)
# Include this only if you need PDF menus
RUN apt-get update && apt-get install -y poppler-utils && rm -rf /var/lib/apt/lists/*

# Copy dependency files and install production dependencies only
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the application code
COPY --chown=node:node . ./

USER node

CMD ["node", "main.js"]