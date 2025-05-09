import os
import logging

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_login import LoginManager
from werkzeug.middleware.proxy_fix import ProxyFix

from config import Config

class Base(DeclarativeBase):
    pass

# Initialize Flask extensions
db = SQLAlchemy(model_class=Base)
login_manager = LoginManager()

# Create app
def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Set up logging
    logging.basicConfig(level=getattr(logging, app.config['LOG_LEVEL']))
    
    # Set up SQLAlchemy engine options for better connection reliability
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,  # Enable connection verification before usage
        'pool_recycle': 300,    # Recycle connections every 5 minutes
        'connect_args': {
            'connect_timeout': 10,  # Connection timeout in seconds
            'application_name': 'benton_county_assessor'  # Helps identify the application in database logs
        },
        'pool_size': 10,        # Maximum number of connections to keep
        'max_overflow': 15     # Maximum number of connections above pool_size
    }
    
    # Initialize extensions with the app
    db.init_app(app)
    login_manager.init_app(app)
    
    # Needed for url_for to generate URLs with https
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    # Register error handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return "Page not found", 404
    
    @app.errorhandler(500)
    def internal_server_error(e):
        return "Internal server error", 500
    
    # Create database tables
    with app.app_context():
        # Import models 
        import models
        
        # Initialize database
        db.create_all()
        
        # Initialize trackers
        from services.trackers import initialize_trackers
        initialize_trackers()
    
    # Register blueprints
    from routes.ai_api import ai_api_bp
    from routes.web import web_bp
    from routes.bill_api import bill_api_bp
    app.register_blueprint(ai_api_bp)
    app.register_blueprint(web_bp)
    app.register_blueprint(bill_api_bp)
    
    # Configure Flask-Login
    login_manager.login_view = 'web.login'
    login_manager.login_message_category = 'info'
    
    # Debug routes
    @app.route('/debug/routes')
    def debug_routes():
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                "endpoint": rule.endpoint,
                "methods": list(rule.methods),
                "path": rule.rule
            })
        return {"routes": routes}
    
    return app

# Create the app instance
app = create_app()

# Load user function for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)