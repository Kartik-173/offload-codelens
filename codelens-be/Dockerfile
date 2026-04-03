FROM wollomatic/opengrep:latest

ENTRYPOINT []

WORKDIR /app

RUN apk add --no-cache \
    nodejs \
    npm \
    git \
    curl \
    unzip \
    bash \
    coreutils \
    procps \
    libc6-compat \
    openjdk17-jre-headless

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk
ENV PATH="$JAVA_HOME/bin:$PATH"

RUN curl -fSL https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip -o /tmp/sonar.zip \
 && unzip -q /tmp/sonar.zip -d /tmp \
 && mv /tmp/sonar-scanner-*-linux /opt/sonar-scanner \
 && ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/bin/sonar-scanner \
 && sed -i 's/use_embedded_jre=true/use_embedded_jre=false/g' /opt/sonar-scanner/bin/sonar-scanner \
 && rm -rf /tmp/sonar.zip /tmp/sonar-scanner-*

RUN mkdir -p /app/logs && touch /app/logs/access.log

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /tmp/scans /tmp/reports /tmp/sarif

EXPOSE 3000

CMD ["npm", "start"]
