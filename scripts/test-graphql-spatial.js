/**
 * GraphQL Spatial Query Test Script
 * 
 * This script tests the GraphQL API for spatial queries after importing real parcel data.
 * It verifies that parcel boundaries are correctly being returned and visualized.
 */

const axios = require('axios');

// Configuration
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:5000/graphql';
const BBOX = [-122.7, 45.4, -122.5, 45.6]; // Default bounding box for testing
const MAX_PARCELS = 10; // Maximum number of parcels to return in results

async function testGraphQLSpatialQueries() {
  console.log(`[${new Date().toISOString()}] Starting GraphQL spatial query tests...\n`);
  
  try {
    // 1. Test parcels in bounding box query
    console.log(`Testing parcelsInBBox query with bbox: [${BBOX.join(', ')}]`);
    
    const bboxResponse = await axios.post(GRAPHQL_ENDPOINT, {
      query: `
        query ParcelsInBBox($bbox: [Float!]!) {
          parcelsInBBox(bbox: $bbox) {
            id
            parcel_id
            address
            owner_name
            county
            state_code
            geom
            centroid
          }
        }
      `,
      variables: {
        bbox: BBOX
      }
    });
    
    const bboxData = bboxResponse.data;
    
    if (bboxData.errors) {
      console.error('GraphQL Error:', bboxData.errors);
      process.exit(1);
    }
    
    const parcels = bboxData.data.parcelsInBBox;
    console.log(`Found ${parcels.length} parcels in bounding box`);
    
    if (parcels.length > 0) {
      const sample = parcels.slice(0, Math.min(parcels.length, MAX_PARCELS));
      
      console.log('\nSample parcels:');
      sample.forEach(parcel => {
        console.log(`  ID: ${parcel.id}, Parcel ID: ${parcel.parcel_id}`);
        console.log(`  Address: ${parcel.address || 'N/A'}`);
        
        // Check if geom and centroid exist
        const hasGeom = parcel.geom && Object.keys(parcel.geom).length > 0;
        const hasCentroid = parcel.centroid && Object.keys(parcel.centroid).length > 0;
        
        console.log(`  Has Geometry: ${hasGeom ? 'Yes' : 'No'}`);
        console.log(`  Has Centroid: ${hasCentroid ? 'Yes' : 'No'}`);
        
        if (hasGeom) {
          const coordCount = parcel.geom.coordinates ? 
            countCoordinates(parcel.geom.coordinates) : 'Unknown';
          console.log(`  Geometry Type: ${parcel.geom.type}`);
          console.log(`  Vertices: ${coordCount}`);
        }
        
        if (hasCentroid && parcel.centroid.coordinates) {
          console.log(`  Centroid: [${parcel.centroid.coordinates.join(', ')}]`);
        }
        
        console.log('  ---');
      });
    } else {
      console.log('No parcels found in the specified bounding box.');
      console.log('You may need to adjust the bounding box coordinates or verify data import.');
    }
    
    // 2. Test parcel by ID query (if we have parcels)
    if (parcels.length > 0) {
      const testParcelId = parcels[0].parcel_id || parcels[0].id;
      console.log(`\nTesting parcel by ID query with ID: ${testParcelId}`);
      
      const parcelResponse = await axios.post(GRAPHQL_ENDPOINT, {
        query: `
          query ParcelById($id: String!) {
            parcel(id: $id) {
              id
              parcel_id
              address
              owner_name
              geom
              centroid
            }
          }
        `,
        variables: {
          id: String(testParcelId)
        }
      });
      
      const parcelData = parcelResponse.data;
      
      if (parcelData.errors) {
        console.error('GraphQL Error:', parcelData.errors);
      } else if (parcelData.data && parcelData.data.parcel) {
        console.log('Successfully retrieved parcel by ID');
        console.log(`  Address: ${parcelData.data.parcel.address || 'N/A'}`);
        console.log(`  Owner: ${parcelData.data.parcel.owner_name || 'N/A'}`);
        console.log(`  Has Geometry: ${parcelData.data.parcel.geom ? 'Yes' : 'No'}`);
      } else {
        console.log(`Parcel with ID ${testParcelId} not found`);
      }
    }
    
    console.log('\nGraphQL spatial query test complete');
    
  } catch (error) {
    console.error('Error running GraphQL tests:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Helper function to count coordinates in a GeoJSON geometry
function countCoordinates(coordinates) {
  if (!Array.isArray(coordinates)) {
    return 0;
  }
  
  if (coordinates.length === 0) {
    return 0;
  }
  
  if (Array.isArray(coordinates[0])) {
    if (typeof coordinates[0][0] === 'number') {
      // This is a single coordinate pair
      return 1;
    } else {
      // This is a nested array, recursively count
      let total = 0;
      for (const coord of coordinates) {
        total += countCoordinates(coord);
      }
      return total;
    }
  }
  
  // Single coordinate pair
  return 1;
}

// Run the tests
testGraphQLSpatialQueries();