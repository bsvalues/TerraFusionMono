"""
Property Map Module for MCP Assessor Agent API

This module provides advanced functionality to visualize property data on a map,
including GeoJSON conversion, property filtering, clustering, heat maps, and statistical analysis.
"""

import json
import os
import logging
import statistics
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Union, Any
from sqlalchemy import text, func, desc, or_, and_
from sqlalchemy.exc import SQLAlchemyError
from flask import jsonify, request, current_app, Response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default map boundaries for Richland, WA area
DEFAULT_BOUNDS = {
    "north": 46.3507,
    "south": 46.2107,
    "east": -119.2087,
    "west": -119.3487
}

# Cache for property data with 30-minute expiration
PROPERTY_CACHE = {
    'data': None,
    'timestamp': None,
    'expiration': 30 * 60  # 30 minutes in seconds
}

def get_db_connection():
    """Get a database connection from the Flask application context."""
    from main import db
    return db.session

def get_cities_list() -> List[str]:
    """
    Get a list of all cities from the accounts table.
    
    Returns:
        List[str]: List of city names
    """
    try:
        db_session = get_db_connection()
        
        # Query distinct cities from accounts table
        query = text("""
            SELECT DISTINCT property_city 
            FROM accounts 
            WHERE property_city IS NOT NULL AND property_city != ''
            ORDER BY property_city
        """)
        
        result = db_session.execute(query)
        cities = [row[0] for row in result]
        return cities
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving cities: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error retrieving cities: {str(e)}")
        return []

def get_property_data(
    data_source: str = 'accounts', 
    value_filter: str = 'all',
    city: Optional[str] = None,
    property_types: Optional[List[str]] = None,
    use_cache: bool = True,
    limit: int = 10000  # Increased limit for better data coverage
) -> Tuple[Dict[str, Any], Dict[str, Any], List[Dict[str, Any]]]:
    """
    Get property data for mapping with advanced filtering options.
    
    Args:
        data_source: The data source table ('accounts', 'improvements', etc.)
        value_filter: Filter properties by value range ('all', '0-100000', etc.)
        city: Filter properties by city
        property_types: List of property types to include (e.g. ['Residential', 'Commercial'])
        use_cache: Whether to use cached data if available
        limit: Maximum number of properties to return
        
    Returns:
        Tuple containing:
        - Statistics dictionary with count, average, median, min, max values
        - Map boundaries dictionary
        - List of property data dictionaries with coordinates for mapping
    """
    # Check cache first if enabled
    if use_cache and PROPERTY_CACHE['data'] is not None and PROPERTY_CACHE['timestamp'] is not None:
        current_time = datetime.now()
        cache_age = (current_time - PROPERTY_CACHE['timestamp']).total_seconds()
        
        if cache_age < PROPERTY_CACHE['expiration']:
            logger.info(f"Using cached property data (age: {cache_age:.1f} seconds)")
            
            # Apply filters to cached data for improved performance
            cached_stats, cached_bounds, cached_properties = PROPERTY_CACHE['data']
            
            # Filter properties based on criteria
            filtered_properties = []
            filtered_values = []
            
            for prop in cached_properties:
                # Skip properties with missing required data
                if not prop.get('latitude') or not prop.get('longitude'):
                    continue
                
                # Apply value filter
                if value_filter != 'all':
                    if '-' in value_filter:
                        min_val, max_val = map(float, value_filter.split('-'))
                        if not prop.get('assessed_value') or prop['assessed_value'] < min_val or prop['assessed_value'] > max_val:
                            continue
                    elif value_filter.endswith('+'):
                        min_val = float(value_filter.rstrip('+'))
                        if not prop.get('assessed_value') or prop['assessed_value'] < min_val:
                            continue
                
                # Apply city filter
                if city and city != 'all' and prop.get('property_city') != city:
                    continue
                
                # Apply property type filter
                if property_types and prop.get('property_type') not in property_types:
                    continue
                
                filtered_properties.append(prop)
                if prop.get('assessed_value'):
                    filtered_values.append(float(prop['assessed_value']))
            
            # Recalculate statistics and boundaries for filtered data
            filtered_stats = calculate_property_statistics(filtered_values)
            filtered_bounds = calculate_map_boundaries(filtered_properties)
            
            return filtered_stats, filtered_bounds, filtered_properties
    
    try:
        db_session = get_db_connection()
        
        # Build the base query depending on data source
        if data_source == 'accounts':
            base_query = """
                SELECT 
                    account_id,
                    owner_name,
                    property_address,
                    property_city,
                    assessed_value,
                    property_type,
                    longitude,
                    latitude,
                    legal_description,
                    tax_amount,
                    tax_status
                FROM accounts
                WHERE 
                    latitude IS NOT NULL 
                    AND longitude IS NOT NULL
            """
        else:
            # Default to accounts if an unsupported data source is specified
            base_query = """
                SELECT 
                    account_id,
                    owner_name,
                    property_address,
                    property_city,
                    assessed_value,
                    property_type,
                    longitude,
                    latitude,
                    legal_description,
                    tax_amount,
                    tax_status
                FROM accounts
                WHERE 
                    latitude IS NOT NULL 
                    AND longitude IS NOT NULL
            """
        
        # Add value filter
        if value_filter != 'all':
            if '-' in value_filter:
                min_val, max_val = value_filter.split('-')
                base_query += f" AND assessed_value >= {min_val} AND assessed_value <= {max_val}"
            elif value_filter.endswith('+'):
                min_val = value_filter.rstrip('+')
                base_query += f" AND assessed_value >= {min_val}"
        
        # Add city filter
        if city and city != 'all':
            base_query += f" AND property_city = '{city}'"
        
        # Add property type filter
        if property_types and len(property_types) > 0:
            type_conditions = ", ".join([f"'{t}'" for t in property_types])
            base_query += f" AND property_type IN ({type_conditions})"
        
        # Complete the query with order and limit
        complete_query = base_query + f" ORDER BY assessed_value DESC LIMIT {limit}"
        
        # Execute the query
        result = db_session.execute(text(complete_query))
        properties = []
        
        # Extract property values for statistics calculation
        property_values = []
        
        # Process query results
        for row in result:
            # Convert SQLAlchemy Row to dictionary with float conversion for decimal values
            property_data = {
                'account_id': row.account_id,
                'owner_name': row.owner_name,
                'property_address': row.property_address,
                'property_city': row.property_city,
                'assessed_value': float(row.assessed_value) if row.assessed_value else None,
                'property_type': row.property_type,
                'longitude': float(row.longitude) if row.longitude else None,
                'latitude': float(row.latitude) if row.latitude else None,
                'legal_description': row.legal_description,
                'tax_amount': float(row.tax_amount) if row.tax_amount else None,
                'tax_status': row.tax_status
            }
            properties.append(property_data)
            
            # Add property value for statistics if available
            if row.assessed_value:
                property_values.append(float(row.assessed_value))
        
        # Calculate statistics
        stats = calculate_property_statistics(property_values)
        
        # Calculate map boundaries based on data
        bounds = calculate_map_boundaries(properties)
        
        # Update cache with new data
        PROPERTY_CACHE['data'] = (stats, bounds, properties)
        PROPERTY_CACHE['timestamp'] = datetime.now()
        
        logger.info(f"Loaded {len(properties)} properties from database and updated cache")
        
        return stats, bounds, properties
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving property data: {str(e)}")
        return {}, DEFAULT_BOUNDS, []
    except Exception as e:
        logger.error(f"Unexpected error retrieving property data: {str(e)}")
        return {}, DEFAULT_BOUNDS, []

def get_property_images(account_id: str) -> List[Dict[str, Any]]:
    """
    Get images associated with a specific property.
    
    Args:
        account_id: The account ID to fetch images for
        
    Returns:
        List of property image dictionaries
    """
    try:
        db_session = get_db_connection()
        
        query = text("""
            SELECT 
                id,
                account_id,
                image_url,
                image_path,
                image_type,
                image_date,
                file_format
            FROM property_images
            WHERE account_id = :account_id
        """)
        
        result = db_session.execute(query, {'account_id': account_id})
        
        images = []
        for row in result:
            image_data = {
                'image_id': row.id,
                'account_id': row.account_id,
                'image_url': row.image_url,
                'image_path': row.image_path,
                'image_type': row.image_type,
                'image_date': row.image_date.isoformat() if hasattr(row.image_date, 'isoformat') else row.image_date,
                'file_format': row.file_format
            }
            images.append(image_data)
        
        return images
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving property images: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error retrieving property images: {str(e)}")
        return []

def convert_to_geojson(properties: List[Dict[str, Any]], include_extended_data: bool = True) -> Dict[str, Any]:
    """
    Convert a list of property dictionaries to GeoJSON format with enhanced property data.
    
    Args:
        properties: List of property dictionaries with latitude and longitude
        include_extended_data: Whether to include extended property data
        
    Returns:
        GeoJSON dictionary
    """
    features = []
    
    for prop in properties:
        # Skip properties without coordinates
        if not prop.get('latitude') or not prop.get('longitude'):
            continue
            
        # Create base property data
        property_data = {
            'account_id': prop.get('account_id', ''),
            'owner_name': prop.get('owner_name', ''),
            'property_address': prop.get('property_address', ''),
            'property_city': prop.get('property_city', ''),
            'assessed_value': prop.get('assessed_value', 0),
            'property_type': prop.get('property_type', 'unknown')
        }
        
        # Add extended data if requested
        if include_extended_data:
            additional_data = {
                'legal_description': prop.get('legal_description', ''),
                'tax_amount': prop.get('tax_amount', 0),
                'tax_status': prop.get('tax_status', '')
            }
            property_data.update(additional_data)
        
        # Create GeoJSON feature
        feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [prop['longitude'], prop['latitude']]
            },
            'properties': property_data
        }
        features.append(feature)
    
    # Create GeoJSON structure
    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }
    
    return geojson

def prepare_heatmap_data(properties: List[Dict[str, Any]], value_field: str = 'assessed_value') -> List[List[float]]:
    """
    Prepare data for the heatmap visualization.
    
    Args:
        properties: List of property dictionaries with latitude, longitude and values
        value_field: The field to use for heat intensity
        
    Returns:
        List of [lat, lng, intensity] lists for heatmap
    """
    heatmap_points = []
    
    for prop in properties:
        # Skip properties without coordinates or values
        if not prop.get('latitude') or not prop.get('longitude') or not prop.get(value_field):
            continue
        
        # Scale value for better visualization
        value = float(prop[value_field])
        # Use square root scaling to prevent extremely high values from dominating
        intensity = math.sqrt(value) / 100
        
        # Create heatmap point
        point = [
            prop['latitude'], 
            prop['longitude'], 
            intensity
        ]
        heatmap_points.append(point)
    
    return heatmap_points

def generate_clusters(properties: List[Dict[str, Any]], grid_size: float = 0.01) -> Dict[str, Any]:
    """
    Generate property clusters based on geographic proximity with enhanced visualization data.
    
    Args:
        properties: List of property dictionaries with latitude and longitude
        grid_size: Size of the grid cell for clustering (in degrees)
        
    Returns:
        GeoJSON structure with clusters
    """
    # Group properties by grid cell
    grid_cells = {}
    
    for prop in properties:
        # Skip properties without coordinates
        if not prop.get('latitude') or not prop.get('longitude'):
            continue
        
        # Calculate grid cell
        lat_cell = int(prop['latitude'] / grid_size)
        lng_cell = int(prop['longitude'] / grid_size)
        cell_key = f"{lat_cell}_{lng_cell}"
        
        # Add property to grid cell
        if cell_key not in grid_cells:
            grid_cells[cell_key] = []
        grid_cells[cell_key].append(prop)
    
    # Create cluster features
    features = []
    
    for cell_key, cell_properties in grid_cells.items():
        # Skip cells with no properties
        if not cell_properties:
            continue
        
        # Calculate cluster center
        total_lat = sum(prop['latitude'] for prop in cell_properties)
        total_lng = sum(prop['longitude'] for prop in cell_properties)
        center_lat = total_lat / len(cell_properties)
        center_lng = total_lng / len(cell_properties)
        
        # Calculate value statistics
        values = [prop.get('assessed_value', 0) for prop in cell_properties if prop.get('assessed_value')]
        avg_value = sum(values) / len(values) if values else 0
        max_value = max(values) if values else 0
        min_value = min(values) if values else 0
        median_value = statistics.median(values) if values else 0
        
        # Count property types
        property_types = {}
        for prop in cell_properties:
            prop_type = prop.get('property_type', 'unknown')
            property_types[prop_type] = property_types.get(prop_type, 0) + 1
        
        # Find dominant property type
        dominant_type = max(property_types.items(), key=lambda x: x[1])[0] if property_types else 'unknown'
        
        # Enhanced cluster properties with value distribution
        value_ranges = {
            'under_100k': len([v for v in values if v < 100000]),
            '100k_250k': len([v for v in values if 100000 <= v < 250000]),
            '250k_500k': len([v for v in values if 250000 <= v < 500000]),
            '500k_1m': len([v for v in values if 500000 <= v < 1000000]),
            'over_1m': len([v for v in values if v >= 1000000])
        }
        
        # Create cluster feature with enhanced data
        feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [center_lng, center_lat]
            },
            'properties': {
                'point_count': len(cell_properties),
                'point_count_abbreviated': f"{len(cell_properties)}",
                'avg_value': avg_value,
                'max_value': max_value,
                'min_value': min_value,
                'median_value': median_value,
                'dominant_type': dominant_type,
                'property_types': property_types,
                'value_ranges': value_ranges
            }
        }
        features.append(feature)
    
    # Create GeoJSON structure
    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }
    
    return geojson

def calculate_property_statistics(property_values: List[float]) -> Dict[str, Any]:
    """
    Calculate statistics for property values.
    
    Args:
        property_values: List of property values
        
    Returns:
        Dictionary of statistics (count, average, median, min, max)
    """
    stats = {
        'count': 0,
        'average': 0,
        'median': 0,
        'min': 0,
        'max': 0
    }
    
    if not property_values:
        return stats
    
    # Calculate statistics
    stats['count'] = len(property_values)
    stats['average'] = sum(property_values) / len(property_values)
    stats['median'] = statistics.median(property_values)
    stats['min'] = min(property_values)
    stats['max'] = max(property_values)
    
    return stats

def calculate_map_boundaries(properties: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Calculate map boundaries based on property coordinates.
    
    Args:
        properties: List of property dictionaries with latitude and longitude
        
    Returns:
        Dictionary with north, south, east, west boundaries
    """
    # Use default bounds if no properties with coordinates
    if not properties:
        return DEFAULT_BOUNDS
    
    # Filter properties with valid coordinates
    valid_properties = [p for p in properties if p.get('latitude') and p.get('longitude')]
    
    if not valid_properties:
        return DEFAULT_BOUNDS
    
    # Initialize with first property
    north = south = valid_properties[0]['latitude']
    east = west = valid_properties[0]['longitude']
    
    # Update boundaries based on all properties
    for prop in valid_properties:
        lat = prop['latitude']
        lng = prop['longitude']
        
        north = max(north, lat)
        south = min(south, lat)
        east = max(east, lng)
        west = min(west, lng)
    
    # Add padding to boundaries
    padding = 0.02
    north += padding
    south -= padding
    east += padding
    west -= padding
    
    return {
        'north': north,
        'south': south,
        'east': east,
        'west': west
    }

def get_map_data():
    """Handle GET request for map data with enhanced visualization options."""
    data_source = request.args.get('data_source', 'accounts')
    value_filter = request.args.get('value_filter', 'all')
    city = request.args.get('city', None)
    visualization_mode = request.args.get('visualization', 'markers')
    clustering = request.args.get('clustering', 'false').lower() == 'true'
    grid_size = float(request.args.get('grid_size', '0.01'))
    
    # Get property types if provided
    property_types_param = request.args.get('property_types', None)
    property_types = property_types_param.split(',') if property_types_param else None
    
    # Get property data with filters
    stats, bounds, properties = get_property_data(
        data_source=data_source,
        value_filter=value_filter,
        city=city,
        property_types=property_types
    )
    
    # Generate response based on visualization mode
    if visualization_mode == 'heatmap':
        # Generate heatmap data
        heatmap_data = prepare_heatmap_data(properties)
        response_data = {
            'statistics': stats,
            'bounds': bounds,
            'heatmap': heatmap_data,
            'visualization': 'heatmap'
        }
    elif visualization_mode == 'clusters' or (clustering and len(properties) > 20):
        # Generate clusters for better performance with large datasets
        geojson = generate_clusters(properties, grid_size)
        response_data = {
            'statistics': stats,
            'bounds': bounds,
            'geojson': geojson,
            'visualization': 'clusters'
        }
    else:
        # Convert to regular GeoJSON for small datasets or marker mode
        geojson = convert_to_geojson(properties)
        response_data = {
            'statistics': stats,
            'bounds': bounds,
            'geojson': geojson,
            'visualization': 'markers'
        }
    
    # Return JSON response
    return jsonify(response_data)

def get_map_clusters():
    """Handle GET request for map clusters with value-based grouping."""
    data_source = request.args.get('data_source', 'accounts')
    value_filter = request.args.get('value_filter', 'all')
    city = request.args.get('city', None)
    grid_size = float(request.args.get('grid_size', '0.01'))
    
    # Get property types if provided
    property_types_param = request.args.get('property_types', None)
    property_types = property_types_param.split(',') if property_types_param else None
    
    # Get property data with filters
    stats, bounds, properties = get_property_data(
        data_source=data_source,
        value_filter=value_filter,
        city=city,
        property_types=property_types
    )
    
    # Generate clusters
    geojson = generate_clusters(properties, grid_size)
    
    # Return JSON response
    return jsonify({
        'statistics': stats,
        'bounds': bounds,
        'geojson': geojson
    })

def get_property_types():
    """Get distinct property types for filtering."""
    try:
        db_session = get_db_connection()
        
        # Query distinct property types from accounts table
        query = text("""
            SELECT DISTINCT property_type 
            FROM accounts 
            WHERE property_type IS NOT NULL AND property_type != ''
            ORDER BY property_type
        """)
        
        result = db_session.execute(query)
        property_types = [row[0] for row in result]
        
        return jsonify({
            'property_types': property_types
        })
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving property types: {str(e)}")
        return jsonify({'property_types': []})
    except Exception as e:
        logger.error(f"Unexpected error retrieving property types: {str(e)}")
        return jsonify({'property_types': []})

def get_cities():
    """Get distinct cities for filtering."""
    cities = get_cities_list()
    return jsonify({
        'cities': cities
    })

def get_property_images_for_map(account_id: str):
    """Get property images for a specific account."""
    images = get_property_images(account_id)
    return jsonify({
        'account_id': account_id,
        'images': images
    })

def get_value_ranges():
    """Get property value ranges for filtering."""
    try:
        db_session = get_db_connection()
        
        # Query min and max property values
        query = text("""
            SELECT 
                MIN(assessed_value) as min_value,
                MAX(assessed_value) as max_value,
                AVG(assessed_value) as avg_value
            FROM accounts 
            WHERE assessed_value IS NOT NULL AND assessed_value > 0
        """)
        
        result = db_session.execute(query).fetchone()
        
        # Define value ranges based on actual data
        min_value = float(result.min_value) if result.min_value else 0
        max_value = float(result.max_value) if result.max_value else 0
        avg_value = float(result.avg_value) if result.avg_value else 0
        
        # Create reasonable ranges
        value_ranges = [
            {'label': 'Under $100,000', 'value': '0-100000'},
            {'label': '$100,000 - $250,000', 'value': '100000-250000'},
            {'label': '$250,000 - $500,000', 'value': '250000-500000'},
            {'label': '$500,000 - $1,000,000', 'value': '500000-1000000'},
            {'label': 'Over $1,000,000', 'value': '1000000+'}
        ]
        
        return jsonify({
            'min_value': min_value,
            'max_value': max_value,
            'avg_value': avg_value,
            'ranges': value_ranges
        })
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving value ranges: {str(e)}")
        return jsonify({'ranges': []})
    except Exception as e:
        logger.error(f"Unexpected error retrieving value ranges: {str(e)}")
        return jsonify({'ranges': []})
