#!/bin/bash
# Wrapper script to run database migrations from the project root
# Usage: ./run-db-migrations.sh [command] [options]
# Commands: migrate, clean, info, validate, repair, baseline, sample

# Pass all arguments to the run-migrations.sh script
cd db-migrations && ./run-migrations.sh "$@"