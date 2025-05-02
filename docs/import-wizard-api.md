# Import Wizard API Documentation

This document details the API endpoints for TerraFusion's Import Wizard feature, which allows users to upload, validate, and import various data formats into the platform.

## Base URL

```
/api/import
```

## Endpoints

### Test Endpoint

Verifies if the Import API is configured and functioning properly.

- **URL**: `/api/import/test`
- **Method**: `GET`
- **Response Example**:
  ```json
  {
    "success": true,
    "message": "Import API is working",
    "endpoints": {
      "upload": "/api/import/:type/upload",
      "import": "/api/import/:type/import"
    }
  }
  ```

### File Upload

Uploads and validates files for a specific import type (e.g., PACS, geospatial data).

- **URL**: `/api/import/:type/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: The file to upload (required)
  - `mapping`: JSON string containing column mapping configuration (optional)
- **Response Example**:
  ```json
  {
    "valid": true,
    "totalRows": 250,
    "processedRows": 250,
    "issues": [
      {
        "row": 12,
        "column": "date",
        "value": "2023-13-45",
        "message": "Invalid date format. Expected YYYY-MM-DD.",
        "severity": "error"
      },
      {
        "row": 98,
        "column": "crop_type",
        "value": "wheat2",
        "message": "Unknown crop type. Did you mean 'wheat'?",
        "severity": "warning"
      }
    ],
    "summary": {
      "errors": 3,
      "warnings": 2,
      "info": 0
    }
  }
  ```

### Data Import

Imports previously validated data into the system.

- **URL**: `/api/import/:type/import`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Parameters**:
  - `validationId`: The ID of a previously validated file upload (required)
- **Response Example**:
  ```json
  {
    "success": true,
    "importType": "pacs",
    "recordsImported": 250,
    "timestamp": "2025-05-02T00:36:44.998Z"
  }
  ```

## Supported Import Types

The `:type` parameter in the endpoints supports the following values:

- `pacs`: PACS image data import
- `geospatial`: Geospatial data (coordinates, field boundaries, etc.)
- `soil`: Soil analysis data
- `crop`: Crop information and yield data
- `equipment`: Farm equipment and IoT device data

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: The request was successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `415 Unsupported Media Type`: Unsupported file format
- `500 Internal Server Error`: Server error

Error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (if available)"
}
```

## File Format Support

The import system supports the following file formats:

- CSV (.csv)
- Excel (.xlsx, .xls)

Future versions will add support for:
- JSON (.json)
- GeoJSON (.geojson)
- Shapefile (.shp)