/**
 * GIS API Test Script
 * 
 * This script tests the GIS API endpoints to ensure they are properly registered
 * and functioning with PostGIS integration.
 */

import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:5000/api/gis';

// Log with timestamp
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Test functions
async function testParcelsByBoundingBox() {
  log('Testing GET /parcels/bbox endpoint...');
  try {
    // Using a sample bounding box that should contain some parcels
    const response = await axios.get(`${API_BASE_URL}/parcels/bbox`, {
      params: {
        west: -118.5,
        south: 34.0,
        east: -118.4,
        north: 34.1
      }
    });
    
    log(`Success! Found ${response.data.length} parcels in bounding box`);
    
    if (response.data.length > 0) {
      log(`Sample parcel: ID=${response.data[0].parcel_id}, Address=${response.data[0].address}`);
    }
    
    return true;
  } catch (error) {
    log(`Error testing parcels by bounding box: ${error.message}`);
    if (error.response) {
      log(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testParcelsByNearPoint() {
  log('Testing GET /parcels/near endpoint...');
  try {
    // Using a sample point and radius that should contain some parcels
    const response = await axios.get(`${API_BASE_URL}/parcels/near`, {
      params: {
        lat: 34.05,
        lon: -118.45,
        radius: 2000 // 2km radius
      }
    });
    
    log(`Success! Found ${response.data.length} parcels near point`);
    
    if (response.data.length > 0) {
      log(`Sample parcel: ID=${response.data[0].parcel_id}, Address=${response.data[0].address}`);
    }
    
    return true;
  } catch (error) {
    log(`Error testing parcels near point: ${error.message}`);
    if (error.response) {
      log(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testParcelArea() {
  log('Testing GET /parcels/:id/area endpoint...');
  try {
    // First get a parcel ID to test with
    const parcelsResponse = await axios.get(`${API_BASE_URL}/parcels/bbox`, {
      params: {
        west: -118.5,
        south: 34.0,
        east: -118.4,
        north: 34.1
      }
    });
    
    if (parcelsResponse.data.length === 0) {
      log('No parcels found to test area calculation');
      return false;
    }
    
    const testParcelId = parcelsResponse.data[0].parcel_id;
    
    // Test area calculation with different units
    const areaUnits = ['SQUARE_METERS', 'SQUARE_FEET', 'ACRES', 'HECTARES'];
    
    for (const unit of areaUnits) {
      const areaResponse = await axios.get(`${API_BASE_URL}/parcels/${testParcelId}/area`, {
        params: { unit }
      });
      
      log(`Parcel ${testParcelId} area: ${areaResponse.data.area} ${areaResponse.data.unit}`);
    }
    
    return true;
  } catch (error) {
    log(`Error testing parcel area: ${error.message}`);
    if (error.response) {
      log(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  log('Starting GIS API tests...');
  
  const results = {
    boundingBox: await testParcelsByBoundingBox(),
    nearPoint: await testParcelsByNearPoint(),
    parcelArea: await testParcelArea()
  };
  
  log('\nTest Results:');
  log(`Bounding Box Test: ${results.boundingBox ? 'PASSED' : 'FAILED'}`);
  log(`Near Point Test: ${results.nearPoint ? 'PASSED' : 'FAILED'}`);
  log(`Parcel Area Test: ${results.parcelArea ? 'PASSED' : 'FAILED'}`);
  
  const allPassed = Object.values(results).every(result => result);
  log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
}

// Execute tests
runTests().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});