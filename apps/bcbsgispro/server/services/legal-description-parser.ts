/**
 * Legal Description Parser Service
 * 
 * This service provides utilities for parsing legal descriptions of properties and
 * converting them into GeoJSON geometries for visualization on maps.
 */

import { Parcel } from "../../shared/schema";

// Geographic coordinate reference
export interface Coordinate {
  lat: number;
  lng: number;
}

// A point in a legal description (with optional metadata)
export interface DescriptionPoint {
  coordinate: Coordinate;
  description?: string;
  type: "corner" | "midpoint" | "reference" | string;
}

// A line segment in a legal description
export interface DescriptionSegment {
  start: DescriptionPoint;
  end: DescriptionPoint;
  description?: string;
  type: "boundary" | "reference" | "extension";
  bearing?: string; // e.g., "N45°E"
  distance?: string; // e.g., "150 feet"
}

// A parsed legal description result
// This interface is used internally by the parser
export interface ParsedLegalDescriptionDetails {
  points: DescriptionPoint[];
  segments: DescriptionSegment[];
  polygon?: GeoJSON.Polygon;
  confidence: number; // 0-1 scale of how confident the parser is
  issues?: string[]; // Any issues found during parsing
}

// Re-export the schema interface for compatibility
import type { ParsedLegalDescription } from "../../shared/schema";

/**
 * Common patterns found in legal descriptions
 */
export enum LegalDescriptionPattern {
  METES_AND_BOUNDS = "metes_and_bounds",
  RECTANGULAR_SURVEY_SYSTEM = "rectangular_survey_system",
  LOT_AND_BLOCK = "lot_and_block",
  INFORMAL = "informal"
}

/**
 * Parse a legal description text and convert it to GeoJSON
 * 
 * @param text The legal description text
 * @returns ParsedLegalDescription object containing points, segments, and polygon
 */
/**
 * Helper function to safely work with extended properties that aren't in the schema
 */
function extendedProp<T>(obj: ParsedLegalDescription, prop: string, defaultValue: T): T {
  return (obj as any)[prop] !== undefined ? (obj as any)[prop] : defaultValue;
}

/**
 * Helper function to safely set extended properties on ParsedLegalDescription
 */
function setExtendedProp<T>(obj: ParsedLegalDescription, prop: string, value: T): void {
  (obj as any)[prop] = value;
}

export function parseLegalDescription(text: string): ParsedLegalDescription {
  // Detect the pattern type
  const patternType = detectDescriptionPattern(text);
  
  // Create a default result with base fields required by the shared schema
  let result: ParsedLegalDescription = {
    township: '',
    range: '',
    section: '',
    description: text
  };
  
  // Initialize extended properties
  setExtendedProp(result, 'points', []);
  setExtendedProp(result, 'segments', []);
  setExtendedProp(result, 'confidence', 0);
  setExtendedProp(result, 'issues', []);
  
  try {
    switch (patternType) {
      case LegalDescriptionPattern.METES_AND_BOUNDS:
        result = parseMetesAndBounds(text);
        break;
      case LegalDescriptionPattern.RECTANGULAR_SURVEY_SYSTEM:
        result = parseRectangularSurvey(text);
        break;
      case LegalDescriptionPattern.LOT_AND_BLOCK:
        result = parseLotAndBlock(text);
        break;
      case LegalDescriptionPattern.INFORMAL:
        result = parseInformalDescription(text);
        break;
      default:
        const issues = extendedProp(result, 'issues', []);
        issues.push("Unable to determine description pattern");
        setExtendedProp(result, 'issues', issues);
        setExtendedProp(result, 'confidence', 0.1);
    }
  } catch (error) {
    const issues = extendedProp(result, 'issues', []);
    issues.push(`Error parsing description: ${error instanceof Error ? error.message : String(error)}`);
    setExtendedProp(result, 'issues', issues);
    setExtendedProp(result, 'confidence', 0);
  }
  
  // If parsing produced points but no polygon, try to create one
  const points = extendedProp(result, 'points', []);
  if (points.length > 2 && !extendedProp(result, 'polygon', null)) {
    try {
      setExtendedProp(result, 'polygon', createPolygonFromPoints(points.map(p => p.coordinate)));
    } catch (error) {
      const issues = extendedProp(result, 'issues', []);
      issues.push(`Error creating polygon: ${error instanceof Error ? error.message : String(error)}`);
      setExtendedProp(result, 'issues', issues);
    }
  }
  
  return result;
}

/**
 * Detect the pattern type of a legal description
 */
function detectDescriptionPattern(text: string): LegalDescriptionPattern {
  // Normalize text
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
  
  // Check for rectangular survey system patterns (township/range)
  if (/township|range|section|quarter|t\d+[nsew]|r\d+[nsew]/.test(normalizedText)) {
    return LegalDescriptionPattern.RECTANGULAR_SURVEY_SYSTEM;
  }
  
  // Check for metes and bounds patterns (bearings and distances)
  if (/(north|south|east|west|n|s|e|w)(\s*\d+\s*degrees|\s*\d+°)/.test(normalizedText) && 
      /(feet|foot|ft|meters|m|chains)/.test(normalizedText)) {
    return LegalDescriptionPattern.METES_AND_BOUNDS;
  }
  
  // Check for lot and block patterns
  if (/lot\s+\d+|block\s+\d+|subdivision|plat/.test(normalizedText)) {
    return LegalDescriptionPattern.LOT_AND_BLOCK;
  }
  
  // Default to informal
  return LegalDescriptionPattern.INFORMAL;
}

/**
 * Parse a metes and bounds description
 */
function parseMetesAndBounds(text: string): ParsedLegalDescription {
  // Create the base object based on the shared schema definition
  const result: ParsedLegalDescription = {
    township: '',
    range: '',
    section: '',
    description: text
  };
  
  // Add additional properties for internal use using helper functions
  setExtendedProp(result, 'points', []);
  setExtendedProp(result, 'segments', []);
  setExtendedProp(result, 'confidence', 0.7); // Default confidence
  setExtendedProp(result, 'issues', []);
  
  // Simple parsing for demonstration - in reality, this would be much more complex
  // This is a placeholder implementation
  
  // Extract potential point of beginning
  const pobMatch = /point of (beginning|commencement)|POB|P\.O\.B\.|commencing at/i.exec(text);
  if (pobMatch) {
    // For demo purposes, use a fixed starting point - this would be parsed from the text
    const startPoint: DescriptionPoint = {
      coordinate: { lat: 47.586, lng: -122.347 }, // Example coordinate
      description: "Point of Beginning",
      type: "corner"
    };
    const points = extendedProp(result, 'points', []);
    points.push(startPoint);
    setExtendedProp(result, 'points', points);
  } else {
    const issues = extendedProp(result, 'issues', []);
    issues.push("No clear point of beginning found");
    setExtendedProp(result, 'issues', issues);
    
    const confidence = extendedProp(result, 'confidence', 0.7);
    setExtendedProp(result, 'confidence', confidence - 0.2);
  }
  
  // Extract bearings and distances
  const bearingMatches = text.matchAll(/(?:thence|then)?\s*(north|south|east|west|n|s|e|w)(?:\s*(\d+)(?:°|degrees|deg))?(?:\s*(east|west|north|south|e|w|n|s))?(?:\s*(\d+(?:\.\d+)?)\s*(feet|foot|ft|meters|m|chains))/gi);
  
  // Get current points from extended properties
  const parsedPoints = extendedProp(result, 'points', []);
  let lastPoint = parsedPoints.length > 0 ? parsedPoints[0] : {
    coordinate: { lat: 47.586, lng: -122.347 }, // Default if no POB
    type: "corner"
  };
  
  let index = 0;
  for (const match of bearingMatches) {
    index++;
    // This is a simplified calculation that doesn't account for actual geographic conversions
    // In a real implementation, proper bearing and distance calculations would be used
    
    const bearing = `${match[1]}${match[2] ? match[2] + "°" : ""}${match[3] ? match[3] : ""}`;
    const distance = `${match[4]} ${match[5]}`;
    
    // Calculate next point (very simplified)
    // This is just for demonstration - not geographically accurate
    const distanceValue = parseFloat(match[4]);
    const scaleFactor = 0.00001; // Arbitrary scale for demonstration
    const bearingAngle = calculateBearingAngle(bearing);
    
    const nextPoint: DescriptionPoint = {
      coordinate: {
        lat: lastPoint.coordinate.lat + Math.cos(bearingAngle) * distanceValue * scaleFactor,
        lng: lastPoint.coordinate.lng + Math.sin(bearingAngle) * distanceValue * scaleFactor
      },
      description: `Point ${index + 1}`,
      type: "corner"
    };
    
    // Create segment
    const segment: DescriptionSegment = {
      start: lastPoint,
      end: nextPoint,
      description: `${bearing} ${distance}`,
      bearing: bearing,
      distance: distance,
      type: "boundary"
    };
    
    // Add points and segments safely
    const points = extendedProp(result, 'points', []);
    points.push(nextPoint);
    setExtendedProp(result, 'points', points);
    
    const segments = extendedProp(result, 'segments', []);
    segments.push(segment);
    setExtendedProp(result, 'segments', segments);
    
    lastPoint = nextPoint;
  }
  
  // If we found at least 3 points, we can create a polygon
  const parsedPointsForPolygon = extendedProp(result, 'points', []);
  if (parsedPointsForPolygon.length >= 3) {
    const coordinates = parsedPointsForPolygon.map(p => [p.coordinate.lng, p.coordinate.lat]);
    // Close the polygon by adding the first point again
    if (parsedPointsForPolygon[0]) {
      coordinates.push([parsedPointsForPolygon[0].coordinate.lng, parsedPointsForPolygon[0].coordinate.lat]);
    }
    
    setExtendedProp(result, 'polygon', {
      type: "Polygon",
      coordinates: [coordinates]
    });
  } else {
    const issues = extendedProp(result, 'issues', []);
    issues.push("Not enough points to create a polygon");
    setExtendedProp(result, 'issues', issues);
    
    const confidence = extendedProp(result, 'confidence', 0.7);
    setExtendedProp(result, 'confidence', confidence - 0.3);
  }
  
  return result;
}

/**
 * Parse a rectangular survey system description (Township/Range/Section)
 */
function parseRectangularSurvey(text: string): ParsedLegalDescription {
  // Create result using schema properties
  const result: ParsedLegalDescription = {
    township: '',
    range: '',
    section: '',
    description: text
  };
  
  // Add extended properties using helper functions
  setExtendedProp(result, 'points', []);
  setExtendedProp(result, 'segments', []);
  setExtendedProp(result, 'confidence', 0.6);
  setExtendedProp(result, 'issues', []);
  
  // This is a placeholder implementation - would need real algorithms for:
  // 1. Parsing township, range, section references
  // 2. Converting to actual geographic coordinates
  
  // Example implementation to detect township/range pattern
  const regex = /T(\d+)(N|S).*R(\d+)(E|W)/i;
  const match = regex.exec(text);
  
  if (match) {
    const township = parseInt(match[1]);
    const townshipDir = match[2].toUpperCase();
    const range = parseInt(match[3]);
    const rangeDir = match[4].toUpperCase();
    
    // For demonstration only - this would need real conversion algorithms
    // These are just placeholder values to demonstrate the concept
    const baseCoordinate = { lat: 45.0, lng: -123.0 };
    
    // Adjust based on township and range (very simplified)
    const coordinate = {
      lat: baseCoordinate.lat + (townshipDir === 'N' ? township * 0.1 : -township * 0.1),
      lng: baseCoordinate.lng + (rangeDir === 'E' ? range * 0.1 : -range * 0.1)
    };
    
    // Create a simplified square for demo purposes
    const corners = [
      { lat: coordinate.lat, lng: coordinate.lng },
      { lat: coordinate.lat, lng: coordinate.lng + 0.05 },
      { lat: coordinate.lat + 0.05, lng: coordinate.lng + 0.05 },
      { lat: coordinate.lat + 0.05, lng: coordinate.lng }
    ];
    
    // Add points and segments
    const pointsArray = [];
    const segmentsArray = [];
    
    corners.forEach((corner, index) => {
      const point: DescriptionPoint = {
        coordinate: corner,
        description: `Corner ${index + 1}`,
        type: "corner"
      };
      pointsArray.push(point);
      
      // Add segment (connecting this point to the next)
      if (index < corners.length - 1) {
        const segment: DescriptionSegment = {
          start: point,
          end: { coordinate: corners[index + 1], type: "corner" },
          type: "boundary"
        };
        segmentsArray.push(segment);
      }
    });
    
    // Add the closing segment if we have at least 2 points
    if (pointsArray.length >= 2) {
      segmentsArray.push({
        start: pointsArray[pointsArray.length - 1],
        end: pointsArray[0],
        type: "boundary"
      });
    }
    
    // Set the extended properties
    setExtendedProp(result, 'points', pointsArray);
    setExtendedProp(result, 'segments', segmentsArray);
    
    // Create the polygon
    setExtendedProp(result, 'polygon', {
      type: "Polygon",
      coordinates: [[
        [corners[0].lng, corners[0].lat],
        [corners[1].lng, corners[1].lat],
        [corners[2].lng, corners[2].lat],
        [corners[3].lng, corners[3].lat],
        [corners[0].lng, corners[0].lat] // Close the polygon
      ]]
    });
  } else {
    const issues = extendedProp(result, 'issues', []);
    issues.push("Could not parse township/range information");
    setExtendedProp(result, 'issues', issues);
    setExtendedProp(result, 'confidence', 0.2);
  }
  
  return result;
}

/**
 * Parse a lot and block description
 */
function parseLotAndBlock(text: string): ParsedLegalDescription {
  // Create result using schema properties
  const result: ParsedLegalDescription = {
    township: '',
    range: '',
    section: '',
    description: text
  };
  
  // Add extended properties using helper functions
  setExtendedProp(result, 'points', []);
  setExtendedProp(result, 'segments', []);
  setExtendedProp(result, 'confidence', 0.4);
  setExtendedProp(result, 'issues', ["Lot and block parsing not fully implemented"]);
  
  return result;
}

/**
 * Parse an informal description without standard format
 */
function parseInformalDescription(text: string): ParsedLegalDescription {
  // Create result using schema properties
  const result: ParsedLegalDescription = {
    township: '',
    range: '',
    section: '',
    description: text
  };
  
  // Add extended properties using helper functions
  setExtendedProp(result, 'points', []);
  setExtendedProp(result, 'segments', []);
  setExtendedProp(result, 'confidence', 0.2);
  setExtendedProp(result, 'issues', ["Informal description parsing not fully implemented"]);
  
  return result;
}

/**
 * Create a GeoJSON polygon from a set of points
 */
function createPolygonFromPoints(points: Coordinate[]): GeoJSON.Polygon {
  if (points.length < 3) {
    throw new Error("At least 3 points required to create a polygon");
  }
  
  // Map points to GeoJSON format [lng, lat]
  const coordinates = points.map(p => [p.lng, p.lat]);
  
  // Close the polygon by adding the first point again if it's not already closed
  if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
      coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
    coordinates.push(coordinates[0]);
  }
  
  return {
    type: "Polygon",
    coordinates: [coordinates]
  };
}

/**
 * Calculate bearing angle in radians for simple distance calculation
 * This is a very simplified calculation for demonstration purposes
 */
function calculateBearingAngle(bearing: string): number {
  const normalized = bearing.toLowerCase();
  
  if (normalized.includes('north') || normalized.startsWith('n')) {
    if (normalized.includes('east') || normalized.endsWith('e')) {
      return Math.PI / 4; // NE = 45 degrees
    } else if (normalized.includes('west') || normalized.endsWith('w')) {
      return (Math.PI * 7) / 4; // NW = 315 degrees
    } else {
      return 0; // N = 0 degrees
    }
  } else if (normalized.includes('south') || normalized.startsWith('s')) {
    if (normalized.includes('east') || normalized.endsWith('e')) {
      return (Math.PI * 3) / 4; // SE = 135 degrees
    } else if (normalized.includes('west') || normalized.endsWith('w')) {
      return (Math.PI * 5) / 4; // SW = 225 degrees
    } else {
      return Math.PI; // S = 180 degrees
    }
  } else if (normalized.includes('east') || normalized.startsWith('e')) {
    return Math.PI / 2; // E = 90 degrees
  } else if (normalized.includes('west') || normalized.startsWith('w')) {
    return (Math.PI * 3) / 2; // W = 270 degrees
  }
  
  // Default
  return 0;
}

/**
 * Save a parsed legal description to a parcel
 * 
 * @param parsedDescription The parsed legal description
 * @param parcelId The ID of the parcel to update
 * @returns boolean indicating success
 */
export async function saveParsedDescription(parsedDescription: ParsedLegalDescription, parcelId: number): Promise<boolean> {
  try {
    // This would be implemented to save the data to the database
    // For now, it's a placeholder that returns success
    return true;
  } catch (error) {
    console.error("Error saving parsed description:", error);
    return false;
  }
}

/**
 * Generate sample GeoJSON for testing when no coordinates are available
 */
export function generateSampleParcelGeometry(center: Coordinate, size: number = 0.01): GeoJSON.Polygon {
  const halfSize = size / 2;
  
  // Create a simple square centered at the given coordinates
  return {
    type: "Polygon",
    coordinates: [[
      [center.lng - halfSize, center.lat - halfSize],
      [center.lng + halfSize, center.lat - halfSize],
      [center.lng + halfSize, center.lat + halfSize],
      [center.lng - halfSize, center.lat + halfSize],
      [center.lng - halfSize, center.lat - halfSize] // Close the polygon
    ]]
  };
}