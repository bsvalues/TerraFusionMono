/**
 * TerraFusion Spatial Analysis API Test Script
 * 
 * This script tests all the new advanced spatial analysis endpoints.
 */

import axios from 'axios';

// Simple chalk-like coloring for console output
const chalk = {
  green: (text) => `✓ ${text}`,
  red: (text) => `✗ ${text}`,
  yellow: (text) => `! ${text}`,
  blue: (text) => `ℹ ${text}`
};

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/gis';
const TEST_PARCEL_ID = process.env.TEST_PARCEL_ID || 'SAMPLE-0001';
const TEST_TARGET_PARCEL_ID = process.env.TEST_TARGET_PARCEL_ID || 'SAMPLE-0002';
const TEST_POINT = { lat: 34.052235, lon: -118.243683 }; // Default test point (Los Angeles)

// Helper function to make API requests
async function apiRequest(endpoint, params = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await axios.get(url, { params });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
}

// Test runner
async function runTests() {
  console.log(`[${new Date().toISOString()}] Starting TerraFusion Spatial Analysis API tests...\n`);
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };
  
  async function runTest(name, testFn) {
    console.log(`Testing ${name}...`);
    try {
      const startTime = Date.now();
      const { success, data, error } = await testFn();
      const duration = Date.now() - startTime;
      
      if (success) {
        console.log(chalk.green(`  Passed (${duration}ms)`));
        if (data) console.log(`  Result: `, JSON.stringify(data).substring(0, 150) + '...');
        results.passed++;
        results.tests.push({ name, status: 'passed', duration });
      } else {
        console.log(chalk.red(`  Failed: ${error}`));
        results.failed++;
        results.tests.push({ name, status: 'failed', error });
      }
    } catch (e) {
      console.log(chalk.red(`  Failed with exception: ${e.message}`));
      results.failed++;
      results.tests.push({ name, status: 'failed', error: e.message });
    }
    console.log('');
  }
  
  // 1. Test Buffer Analysis
  await runTest('Buffer Analysis', async () => {
    const response = await apiRequest(`/parcels/${TEST_PARCEL_ID}/buffer`, { 
      distance: 100,
      unit: 'METERS'
    });
    
    if (!response.success) return response;
    
    const valid = response.data.buffer_geom && 
                 response.data.buffer_distance === 100 &&
                 response.data.buffer_unit === 'METERS';
    
    return { 
      success: valid, 
      data: response.data,
      error: valid ? null : 'Invalid buffer response format'
    };
  });
  
  // 2. Test Intersection Analysis
  await runTest('Intersection Analysis', async () => {
    const response = await apiRequest(`/parcels/${TEST_PARCEL_ID}/intersects`);
    
    if (!response.success) return response;
    
    const valid = response.data.source_parcel_id === TEST_PARCEL_ID &&
                 'intersecting_count' in response.data &&
                 Array.isArray(response.data.intersecting_parcels);
    
    return { 
      success: valid, 
      data: { 
        source_parcel_id: response.data.source_parcel_id,
        intersecting_count: response.data.intersecting_count
      },
      error: valid ? null : 'Invalid intersection response format'
    };
  });
  
  // 3. Test Convex Hull Generation
  await runTest('Convex Hull Generation', async () => {
    const response = await apiRequest(`/parcels/${TEST_PARCEL_ID}/convexhull`);
    
    if (!response.success) return response;
    
    const valid = response.data.parcel_id &&
                 response.data.convex_hull &&
                 typeof response.data.convexity_ratio === 'number' &&
                 response.data.complexity_assessment;
    
    return { 
      success: valid, 
      data: {
        parcel_id: response.data.parcel_id,
        convexity_ratio: response.data.convexity_ratio,
        complexity_assessment: response.data.complexity_assessment
      },
      error: valid ? null : 'Invalid convex hull response format'
    };
  });
  
  // 4. Test Distance Calculation
  await runTest('Distance Calculation', async () => {
    const response = await apiRequest(`/parcels/${TEST_PARCEL_ID}/distance`, {
      lat: TEST_POINT.lat,
      lon: TEST_POINT.lon,
      unit: 'KILOMETERS'
    });
    
    if (!response.success) return response;
    
    const valid = response.data.parcel_id &&
                 typeof response.data.distance === 'number' &&
                 response.data.unit === 'KILOMETERS' &&
                 response.data.closest_point &&
                 typeof response.data.closest_point.lat === 'number' &&
                 typeof response.data.closest_point.lon === 'number';
    
    return { 
      success: valid, 
      data: {
        parcel_id: response.data.parcel_id,
        distance: response.data.distance,
        unit: response.data.unit,
        closest_point: response.data.closest_point
      },
      error: valid ? null : 'Invalid distance calculation response format'
    };
  });
  
  // 5. Test Spatial Relationships
  await runTest('Spatial Relationships', async () => {
    const response = await apiRequest(`/parcels/${TEST_PARCEL_ID}/relation/${TEST_TARGET_PARCEL_ID}`, {
      relation: 'intersects'
    });
    
    if (!response.success) return response;
    
    const valid = response.data.source_parcel_id &&
                 response.data.target_parcel_id &&
                 typeof response.data.relation === 'string' &&
                 typeof response.data.result === 'boolean';
    
    return { 
      success: valid, 
      data: {
        source_parcel_id: response.data.source_parcel_id,
        target_parcel_id: response.data.target_parcel_id,
        relation: response.data.relation,
        result: response.data.result
      },
      error: valid ? null : 'Invalid spatial relationship response format'
    };
  });
  
  // 6. Test Topology Validation
  await runTest('Topology Validation', async () => {
    const response = await apiRequest(`/parcels/${TEST_PARCEL_ID}/validate`);
    
    if (!response.success) return response;
    
    const valid = response.data.parcel_id &&
                 response.data.validation &&
                 typeof response.data.validation.is_valid === 'boolean' &&
                 typeof response.data.validation.is_simple === 'boolean' &&
                 typeof response.data.validation.validation_message === 'string';
    
    return { 
      success: valid, 
      data: {
        parcel_id: response.data.parcel_id,
        is_valid: response.data.validation.is_valid,
        validation_message: response.data.validation.validation_message,
        vertices: response.data.validation.num_vertices
      },
      error: valid ? null : 'Invalid topology validation response format'
    };
  });
  
  // 7. Test Nearest Neighbors Analysis
  await runTest('Nearest Neighbors Analysis', async () => {
    const response = await apiRequest(`/parcels/${TEST_PARCEL_ID}/nearest`, {
      limit: 3,
      unit: 'METERS'
    });
    
    if (!response.success) return response;
    
    const valid = response.data.source_parcel_id &&
                 Array.isArray(response.data.nearest_neighbors) &&
                 response.data.count === response.data.nearest_neighbors.length &&
                 response.data.unit === 'METERS';
    
    return { 
      success: valid, 
      data: {
        source_parcel_id: response.data.source_parcel_id,
        neighbors_count: response.data.count,
        unit: response.data.unit
      },
      error: valid ? null : 'Invalid nearest neighbors response format'
    };
  });
  
  // 8. Test Shared Boundary Analysis
  await runTest('Shared Boundary Analysis', async () => {
    const response = await apiRequest(`/parcels/${TEST_PARCEL_ID}/boundary/${TEST_TARGET_PARCEL_ID}`);
    
    if (!response.success) return response;
    
    const valid = response.data.source_parcel_id &&
                 response.data.target_parcel_id &&
                 typeof response.data.touches === 'boolean' &&
                 typeof response.data.shared_boundary_length_m === 'number';
    
    return { 
      success: valid, 
      data: {
        source_parcel_id: response.data.source_parcel_id,
        target_parcel_id: response.data.target_parcel_id,
        touches: response.data.touches,
        shared_boundary_length_m: response.data.shared_boundary_length_m
      },
      error: valid ? null : 'Invalid shared boundary response format'
    };
  });
  
  // Print summary
  console.log('\nTest Results:');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  
  if (results.failed === 0) {
    console.log(chalk.green('\nAll tests passed!'));
  } else {
    console.log(chalk.red(`\n${results.failed} test(s) failed!`));
  }
  
  return results;
}

// Run tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});

export { runTests };