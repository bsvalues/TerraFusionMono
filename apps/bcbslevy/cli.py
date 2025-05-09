"""
Command-line interface extensions for the Levy Calculation Application.

This module provides custom CLI commands for the Flask application to help
with database management, migrations, and other administrative tasks.
"""

import os
import sys
import click
import logging
from datetime import datetime
from flask import current_app
from flask.cli import with_appcontext

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@click.group()
def db_utils():
    """Database utilities for the Levy Calculation Application."""
    pass

@db_utils.command()
@with_appcontext
def backup():
    """Backup the database to a file."""
    from app import db
    
    # Create backups directory if it doesn't exist
    if not os.path.exists('backups'):
        os.makedirs('backups')
        logger.info("Created backups directory")
    
    # First try with the simple backup method (psycopg2 based)
    try:
        logger.info("Attempting backup using psycopg2 method...")
        # Import locally to avoid circular imports
        from pg_backup_simple import backup_database as simple_backup
        success, filepath = simple_backup()
        
        if success:
            logger.info(f"Database backup created successfully: {filepath}")
            return
        else:
            logger.warning("Simple backup method failed, falling back to pg_dump...")
    except Exception as e:
        logger.warning(f"Simple backup error: {str(e)}, falling back to pg_dump...")
    
    # Fallback to pg_dump method
    try:
        # Get the current timestamp for the backup filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"backups/database_backup_{timestamp}.sql"
        
        # Get database connection parameters from environment
        pg_host = os.environ.get('PGHOST')
        pg_user = os.environ.get('PGUSER')
        pg_password = os.environ.get('PGPASSWORD')
        pg_database = os.environ.get('PGDATABASE')
        
        if not all([pg_host, pg_user, pg_password, pg_database]):
            logger.error("Database environment variables not set")
            sys.exit(1)
        
        # Build the pg_dump command
        pg_dump_cmd = f"PGPASSWORD='{pg_password}' pg_dump -h {pg_host} -U {pg_user} -d {pg_database} -f {backup_filename}"
        
        # Run the backup command
        logger.info("Starting database backup using pg_dump")
        os.system(pg_dump_cmd)
        
        # Verify backup was created and has content
        if os.path.exists(backup_filename) and os.path.getsize(backup_filename) > 0:
            logger.info(f"Database backup created successfully: {backup_filename}")
        else:
            logger.error("Backup file is empty or does not exist")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to create database backup: {str(e)}")
        sys.exit(1)

@db_utils.command()
@click.argument('backup_file', type=click.Path(exists=True))
@with_appcontext
def restore(backup_file):
    """Restore the database from a backup file."""
    from app import db
    
    # Get database connection parameters from environment
    pg_host = os.environ.get('PGHOST')
    pg_user = os.environ.get('PGUSER')
    pg_password = os.environ.get('PGPASSWORD')
    pg_database = os.environ.get('PGDATABASE')
    
    if not all([pg_host, pg_user, pg_password, pg_database]):
        logger.error("Database environment variables not set")
        sys.exit(1)
    
    # Confirm with user
    click.confirm(f"This will overwrite the current database with {backup_file}. Do you want to continue?", abort=True)
    
    # Check backup file format
    try:
        # Sample the first line of the backup to detect type
        with open(backup_file, 'r') as f:
            first_line = f.readline().strip()
        
        # Use psycopg2 for restoration if it's our simple format
        if first_line.startswith('-- Database Backup:') and 'Generated by: pg_backup_simple.py' in open(backup_file, 'r').read(1000):
            logger.info("Detected pg_backup_simple format, using psycopg2 for restoration")
            
            try:
                # Connect to the database
                import psycopg2
                conn = psycopg2.connect(
                    host=pg_host,
                    port=os.environ.get('PGPORT', 5432),
                    user=pg_user,
                    password=pg_password,
                    database=pg_database
                )
                conn.autocommit = True
                cursor = conn.cursor()
                
                # Read the backup file and execute it
                logger.info(f"Restoring database from {backup_file}")
                with open(backup_file, 'r') as f:
                    sql = f.read()
                    
                # Execute the SQL
                cursor.execute(sql)
                conn.close()
                
                logger.info("Database restored successfully")
                return
            except Exception as e:
                logger.error(f"Failed to restore using psycopg2: {str(e)}")
                logger.info("Falling back to psql method...")
    except Exception as e:
        logger.warning(f"Error checking backup format: {str(e)}")
    
    # Fall back to psql command-line tool for restoration
    # Build the psql command for restoration
    psql_cmd = f"PGPASSWORD='{pg_password}' psql -h {pg_host} -U {pg_user} -d {pg_database} -f {backup_file}"
    
    # Run the restore command
    try:
        logger.info(f"Restoring database using psql from {backup_file}")
        os.system(psql_cmd)
        logger.info("Database restored successfully")
    except Exception as e:
        logger.error(f"Failed to restore database: {str(e)}")
        sys.exit(1)

@db_utils.command()
@with_appcontext
def health_check():
    """Check the health of the database connection."""
    from app import db
    from sqlalchemy import text
    
    try:
        # Execute a simple query to check the connection
        result = db.session.execute(text("SELECT version()"))
        version = result.scalar()
        logger.info(f"Database connection successful. PostgreSQL version: {version}")
        
        # Get table counts for key tables
        tables = [
            "user", "tax_district", "tax_code", "property", 
            "import_log", "export_log", "tax_code_historical_rate"
        ]
        
        logger.info("Table counts:")
        for table in tables:
            try:
                result = db.session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                logger.info(f"  {table}: {count} rows")
            except Exception as e:
                logger.warning(f"  {table}: Unable to count rows - {str(e)}")
        
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False

@db_utils.command()
@with_appcontext
def prune_logs():
    """Prune old database logs beyond specified retention period."""
    from app import db
    from sqlalchemy import text
    
    # Default to 90 days retention
    retention_days = int(os.environ.get('LOG_RETENTION_DAYS', 90))
    
    try:
        # Prune import logs
        result = db.session.execute(
            text(f"DELETE FROM import_log WHERE created_at < NOW() - INTERVAL '{retention_days} days'")
        )
        import_deleted = result.rowcount
        
        # Prune export logs
        result = db.session.execute(
            text(f"DELETE FROM export_log WHERE created_at < NOW() - INTERVAL '{retention_days} days'")
        )
        export_deleted = result.rowcount
        
        db.session.commit()
        
        logger.info(f"Pruned {import_deleted} import logs and {export_deleted} export logs older than {retention_days} days")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to prune logs: {str(e)}")
        sys.exit(1)

# Register the commands with Flask
def register_commands(app):
    """Register custom commands with the Flask application."""
    app.cli.add_command(db_utils)