FROM kestra/kestra:latest

USER root

# Install Node.js, NPM, Git, and Curl
RUN apt-get update && \
    apt-get install -y curl git gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
