/**
 * Mock OSS-RBA Endpoint Tests
 * 
 * Simple test script to validate all endpoints
 */

const BASE_URL = 'http://localhost:4000';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.yellow}🧪 ${msg}${colors.reset}`)
};

// Test counter
let testsPassed = 0;
let testsFailed = 0;

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  log.test('Test 1: Health Check');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (response.status === 200 && data.status === 'OK') {
      log.success('Health check passed');
      testsPassed++;
      return true;
    } else {
      log.error('Health check failed');
      testsFailed++;
      return false;
    }
  } catch (error) {
    log.error(`Health check error: ${error.message}`);
    testsFailed++;
    return false;
  }
}

/**
 * Test 2: Submit Valid Application
 */
async function testValidSubmission() {
  log.test('Test 2: Submit Valid Application');
  try {
    const validData = {
      pemohonNama: 'John Doe Test',
      pemohonNIK: '3201234567890123',
      pemohonEmail: 'test@example.com',
      pemohonTelepon: '081234567890',
      usahaNama: 'PT Test Corp',
      usahaAlamat: 'Jl. Test No. 123',
      usahaProvinsi: 'DKI Jakarta',
      usahaKabKota: 'Jakarta Selatan',
      kbliKode: '47911',
      kbliNama: 'Retail Trade',
      izinJenis: 'Izin Usaha Perdagangan',
      izinDeskripsi: 'Perdagangan retail',
      risikoLevel: 'Rendah'
    };
    
    const response = await fetch(`${BASE_URL}/api/v1/perizinan/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validData)
    });
    
    const data = await response.json();
    
    if (response.status === 201 && data.status === 'success' && data.data.trackingId) {
      log.success(`Submission created: ${data.data.trackingId}`);
      log.info(`NIB: ${data.data.nib || 'N/A'}`);
      testsPassed++;
      return data.data.trackingId;
    } else {
      log.error('Valid submission failed');
      console.log(data);
      testsFailed++;
      return null;
    }
  } catch (error) {
    log.error(`Submission error: ${error.message}`);
    testsFailed++;
    return null;
  }
}

/**
 * Test 3: Submit Invalid Application (missing fields)
 */
async function testInvalidSubmission() {
  log.test('Test 3: Submit Invalid Application');
  try {
    const invalidData = {
      pemohonNama: 'Incomplete User',
      // Missing required fields
    };
    
    const response = await fetch(`${BASE_URL}/api/v1/perizinan/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.status === 'error' && data.errors) {
      log.success('Validation correctly rejected invalid data');
      log.info(`Errors: ${data.errors.join(', ')}`);
      testsPassed++;
      return true;
    } else {
      log.error('Validation should have rejected invalid data');
      testsFailed++;
      return false;
    }
  } catch (error) {
    log.error(`Invalid submission test error: ${error.message}`);
    testsFailed++;
    return false;
  }
}

/**
 * Test 4: Check Status (Immediate)
 */
async function testStatusCheckImmediate(trackingId) {
  log.test('Test 4: Check Status (Immediate)');
  try {
    if (!trackingId) {
      log.error('No tracking ID provided');
      testsFailed++;
      return false;
    }
    
    const response = await fetch(`${BASE_URL}/api/v1/perizinan/status/${trackingId}`);
    const data = await response.json();
    
    if (response.status === 200 && data.status === 'success') {
      log.success(`Status: ${data.data.statusPengajuan}`);
      log.info(`Tracking ID: ${data.data.trackingId}`);
      testsPassed++;
      return true;
    } else {
      log.error('Status check failed');
      testsFailed++;
      return false;
    }
  } catch (error) {
    log.error(`Status check error: ${error.message}`);
    testsFailed++;
    return false;
  }
}

/**
 * Test 5: Check Status (After Delay - should progress to SELESAI)
 */
async function testStatusCheckDelayed(trackingId) {
  log.test('Test 5: Check Status After 35 Seconds (Status Progression)');
  try {
    if (!trackingId) {
      log.error('No tracking ID provided');
      testsFailed++;
      return false;
    }
    
    log.info('Waiting 35 seconds for status progression...');
    await sleep(35000);
    
    const response = await fetch(`${BASE_URL}/api/v1/perizinan/status/${trackingId}`);
    const data = await response.json();
    
    if (response.status === 200 && data.data.statusPengajuan === 'SELESAI') {
      log.success(`Status progressed to: ${data.data.statusPengajuan}`);
      log.info(`History: ${data.data.riwayatStatus.length} status changes`);
      testsPassed++;
      return true;
    } else {
      log.error(`Status should be SELESAI, got: ${data.data?.statusPengajuan}`);
      testsFailed++;
      return false;
    }
  } catch (error) {
    log.error(`Status progression test error: ${error.message}`);
    testsFailed++;
    return false;
  }
}

/**
 * Test 6: Check Non-existent Tracking ID
 */
async function testNonExistentTracking() {
  log.test('Test 6: Check Non-existent Tracking ID');
  try {
    const fakeId = 'nonexistent-tracking-id';
    const response = await fetch(`${BASE_URL}/api/v1/perizinan/status/${fakeId}`);
    const data = await response.json();
    
    if (response.status === 404 && data.status === 'error') {
      log.success('Correctly returned 404 for non-existent tracking ID');
      testsPassed++;
      return true;
    } else {
      log.error('Should return 404 for non-existent tracking ID');
      testsFailed++;
      return false;
    }
  } catch (error) {
    log.error(`Non-existent tracking test error: ${error.message}`);
    testsFailed++;
    return false;
  }
}

/**
 * Test 7: List All Submissions
 */
async function testListSubmissions() {
  log.test('Test 7: List All Submissions');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/perizinan/list`);
    const data = await response.json();
    
    if (response.status === 200 && data.status === 'success' && Array.isArray(data.data)) {
      log.success(`Found ${data.total} submissions`);
      testsPassed++;
      return true;
    } else {
      log.error('List submissions failed');
      testsFailed++;
      return false;
    }
  } catch (error) {
    log.error(`List submissions error: ${error.message}`);
    testsFailed++;
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 Mock OSS-RBA Endpoint Tests');
  console.log('='.repeat(60));
  console.log('');
  
  // Test 1: Health check
  await testHealthCheck();
  console.log('');
  
  // Test 2: Valid submission
  const trackingId = await testValidSubmission();
  console.log('');
  
  // Test 3: Invalid submission
  await testInvalidSubmission();
  console.log('');
  
  // Test 4: Status check (immediate)
  await testStatusCheckImmediate(trackingId);
  console.log('');
  
  // Test 5: Status check (delayed - status progression)
  await testStatusCheckDelayed(trackingId);
  console.log('');
  
  // Test 6: Non-existent tracking ID
  await testNonExistentTracking();
  console.log('');
  
  // Test 7: List submissions
  await testListSubmissions();
  console.log('');
  
  // Summary
  console.log('='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`${colors.green}✅ Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testsFailed}${colors.reset}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log('='.repeat(60));
  
  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log.error(`Test runner error: ${error.message}`);
  process.exit(1);
});
