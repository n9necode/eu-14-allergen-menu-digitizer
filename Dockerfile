# Specify the base Docker image. The available images are documented at
# https://docs.apify.com/sdk/js/docs/guides/docker-images
FROM apify/actor-node:20

# Install poppler-utils for PDF page rendering (Alpine Linux uses apk).
RUN apk update && apk add --no-cache poppler-utils

# Copy just package.json to speed up the build using Docker layer cache.
COPY package.json ./

# Install NPM packages, skip optional and development dependencies to
# keep the image small. Avoid logging too much and print the dependency
# tree for debugging.
RUN npm --quiet set progress=false \
    && npm install --omit=dev --no-optional --no-audit --no-fund \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --no-optional || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# Next, copy the remaining files and directories with the source code.
# Since we do this after NPM install, quick build will be really fast
# for most source file changes.
COPY . ./

# Specify how to launch the source code of your application.
CMD npm start --silent
