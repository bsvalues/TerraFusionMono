"""
Admin routes for the Levy Calculation System.

This module provides routes for administrative functions including:
- Admin dashboard
- System status monitoring
- Administrative tools and settings
"""

import os
import logging
import shutil
from datetime import datetime

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from app import db
from models import (
    User, TaxDistrict, TaxCode, Property, ImportLog, 
    ExportLog, TaxCodeHistoricalRate
)

# Create blueprint
admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# Configure logger
logger = logging.getLogger(__name__)


@admin_bp.route('/')
def dashboard():
    """
    Admin dashboard displaying system status and key metrics.
    
    Returns:
        Rendered template for the admin dashboard
    """
    # Get current tax year
    current_year = datetime.now().year
    
    try:
        # Count records for dashboard metrics
        district_count = TaxDistrict.query.filter_by(year=current_year).count()
    except Exception as e:
        logger.error(f"Error counting tax districts: {str(e)}")
        district_count = 0
        
    try:
        # Use raw SQL to avoid model-database mismatches
        from sqlalchemy import text
        tax_code_count = db.session.execute(
            text("SELECT COUNT(*) FROM tax_code WHERE year = :year"),
            {"year": current_year}
        ).scalar() or 0
    except Exception as e:
        logger.error(f"Error counting tax codes: {str(e)}")
        tax_code_count = 0
        
    try:
        # Use raw SQL to avoid model-database mismatches
        property_count = db.session.execute(
            text("SELECT COUNT(*) FROM property WHERE year = :year"),
            {"year": current_year}
        ).scalar() or 0
    except Exception as e:
        logger.error(f"Error counting properties: {str(e)}")
        property_count = 0
    
    # Get recent imports using schema compatibility utilities
    try:
        from utils.schema_compat import get_import_log_entries
        recent_imports = get_import_log_entries(limit=5)
    except Exception as e:
        logger.error(f"Error getting recent imports: {str(e)}")
        recent_imports = []
    
    # Calculate total assessed value using schema compatibility utilities
    try:
        from utils.schema_compat import get_total_assessed_value
        total_assessed_value = get_total_assessed_value()
    except Exception as e:
        logger.error(f"Error calculating total assessed value: {str(e)}")
        total_assessed_value = 0
    
    # Calculate total levy amount using schema compatibility utilities
    try:
        from utils.schema_compat import get_total_levy_amount
        total_levy_amount = get_total_levy_amount()
    except Exception as e:
        logger.error(f"Error calculating total levy amount: {str(e)}")
        total_levy_amount = 0
    
    # Get disk usage
    try:
        total, used, free = shutil.disk_usage("/")
        disk_usage = f"{used / total:.1%}"
    except:
        disk_usage = "Unknown"
    
    # Example AI insights (to be replaced with actual data in future)
    ai_insights = [
        {
            "title": "Levy Rate Trends",
            "description": "Most tax districts show stable levy rates compared to previous year with a slight average increase of 0.5%."
        },
        {
            "title": "Compliance Alert",
            "description": "Three tax districts are approaching their statutory levy limits and should be monitored."
        }
    ]
    
    return render_template(
        'admin/dashboard.html',
        district_count=district_count,
        tax_code_count=tax_code_count,
        property_count=property_count,
        recent_imports=recent_imports,
        total_assessed_value=total_assessed_value,
        disk_usage=disk_usage,
        ai_insights=ai_insights
    )


@admin_bp.route('/status')
def system_status():
    """
    API endpoint to retrieve system status information.
    
    Returns:
        JSON response with system status data
    """
    try:
        # Check database connection
        db_status = "connected"
        db_error = None
        try:
            from sqlalchemy import text
            db.session.execute(text("SELECT 1"))
        except Exception as e:
            db_status = "error"
            db_error = str(e)
        
        # Check disk space
        try:
            total, used, free = shutil.disk_usage("/")
            disk_total = total // (2**30)  # GB
            disk_used = used // (2**30)  # GB
            disk_free = free // (2**30)  # GB
            disk_percent = used / total * 100
        except:
            disk_total = 0
            disk_used = 0
            disk_free = 0
            disk_percent = 0
        
        # Check Anthropic API
        api_key_exists = os.environ.get('ANTHROPIC_API_KEY') is not None
        
        status = {
            "database": {
                "status": db_status,
                "error": db_error
            },
            "disk": {
                "total_gb": disk_total,
                "used_gb": disk_used,
                "free_gb": disk_free,
                "usage_percent": disk_percent
            },
            "api": {
                "anthropic_api_configured": api_key_exists
            },
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(status)
    
    except Exception as e:
        logger.error(f"Error getting system status: {str(e)}")
        return jsonify({"error": str(e)}), 500


def init_admin_routes(app):
    """
    Initialize admin routes with the Flask app.
    
    Args:
        app: The Flask application instance
    """
    app.register_blueprint(admin_bp)
    app.logger.info('Admin routes initialized')