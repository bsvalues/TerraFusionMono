FROM openjdk:17-slim

# Add PostgreSQL client and utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    wget \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Flyway CLI
RUN wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.20.0/flyway-commandline-9.20.0-linux-x64.tar.gz | tar xvz \
    && ln -s /flyway-9.20.0/flyway /usr/local/bin/flyway

# Add PSQL script for integration tests
COPY devops/ci/scripts/verify-schema.sh /verify-schema.sh
RUN chmod +x /verify-schema.sh

WORKDIR /migrations

# Script to run migrations and verify schema
COPY devops/ci/scripts/run-migrations.sh /run-migrations.sh
RUN chmod +x /run-migrations.sh

ENTRYPOINT ["/run-migrations.sh"]