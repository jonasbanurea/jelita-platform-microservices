/**
 * OSS Integration End-to-End Test
 * 
 * Tests the complete flow:
 * 1. Submit JELITA application to API Gateway
 * 2. API Gateway transforms and submits to OSS-RBA
 * 3. Track submission status
 * 4. Verify data integrity
 */

const BASE_URL = 'http://localhost:3060';

// Colors
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

let testsPassed = 0;
let testsFailed = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  log.test('Test 1: API Gateway Health Check');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (response.status === 200 && data.status === 'OK') {
      log.success('API Gateway is healthy');
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
 * Test 2: OSS Integration Health
 */
async function testOSSHealth() {
  log.test('Test 2: OSS Integration Health Check');
  try {
    const response = await fetch(`${BASE_URL}/api/oss/health`);
    const data = await response.json();
    
    if (response.status === 200 && data.success && data.data.ossService.success) {
      log.success('OSS-RBA connection is healthy');
      log.info(`Circuit breaker: ${data.data.circuitBreaker.isOpen ? 'OPEN' : 'CLOSED'} (${data.data.circuitBreaker.failures} failures)`);
      testsPassed++;
      return true;
    } else {
      log.error('OSS health check failed');
      testsFailed++;
      return false;
    }
  } catch (error) {
    log.error(`OSS health check error: ${error.message}`);
    testsFailed++;
    return false;
  }
}

/**
 * Test 3: Submit Valid Application
 */
async function testSubmitApplication() {
  log.test('Test 3: Submit Valid JELITA Application');
  try {
    const jelitaApplication = {
      jelitaApplicationId: Math.floor(Math.random() * 10000) + 1000,
      applicationData: {
        pemohonNama: 'John Doe Integration Test',
        pemohonNIK: '3201234567890123',
        pemohonEmail: 'john.test@example.com',
        pemohonTelepon: '081234567890',
        usahaNama: 'PT Integration Test Corp',
        usahaAlamat: 'Jl. Integration Test No. 123',
        usahaProvinsi: 'DKI Jakarta',
        usahaKabKota: 'Jakarta Selatan',
        kbliKode: '47911',
        kbliNama: 'Retail Trade',
        izinJenis: 'Izin Usaha Perdagangan',
        izinDeskripsi: 'Integration testing',
        risikoLevel: 'Rendah'
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/oss/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jelitaApplication)
    });
    
    const data = await response.json();
    
    if (response.status === 201 && data.success && data.data.ossTrackingId) {
      log.success(`Application submitted successfully`);
      log.info(`JELITA Application ID: ${data.data.jelitaApplicationId}`);
      log.info(`OSS Tracking ID: ${data.data.ossTrackingId}`);
      log.info(`NIB: ${data.data.ossNIB || 'Pending'}`);
      log.info(`Status: ${data.data.status}`);
      testsPassed++;
      return {
        success: true,
        submissionId: data.data.submissionId,
        jelitaApplicationId: data.data.jelitaApplicationId,
        trackingId: data.data.ossTrackingId
      };
    } else {
      log.error('Application submission failed');
      console.log(data);
      testsFailed++;
      return { success: false };
    }
  } catch (error) {
    log.error(`Submit application error: ${error.message}`);
    testsFailed++;
    return { success: false };
  }
}

/**
 * Test 4: Submit Invalid Application
 */
async function testSubmitInvalidApplication() {
  log.test('Test 4: Submit Invalid Application (Validation Test)');
  try {
    const invalidApplication = {
      jelitaApplicationId: 9999,
      applicationData: {
        pemohonNama: 'Invalid User',
        pemohonNIK: '123', // Invalid NIK (not 16 digits)
        usahaNama: 'Test',
        kbliKode: '123' // Invalid KBLI (not 5 digits)
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/oss/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidApplication)
    });
    
    const data = await response.json();
    
    if (response.status === 400 && !data.success) {
      log.success('Validation correctly rejected invalid data');
      log.info(`Error: ${data.message}`);
      testsPassed++;
      return true;
    } else {
      log.error('Should have rejected invalid data');
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
 * Test 5: Check Status by Tracking ID
 */
async function testCheckStatus(trackingId) {
  log.test('Test 5: Check Submission Status');
  try {
    if (!trackingId) {
      log.error('No tracking ID provided');
      testsFailed++;
      return false;
    }
    
    const response = await fetch(`${BASE_URL}/api/oss/status/${trackingId}`);
    const data = await response.json();
    
    if (response.status === 200 && data.success) {
      log.success(`Status retrieved: ${data.data.status}`);
      log.info(`Submission ID: ${data.data.submissionId}`);
      log.info(`OSS Tracking ID: ${data.data.ossTrackingId}`);
      log.info(`NIB: ${data.data.ossNIB || 'Pending'}`);
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
 * Test 6: Check by JELITA Application ID
 */
async function testCheckByJelitaId(jelitaApplicationId) {
  log.test('Test 6: Check by JELITA Application ID');
  try {
    if (!jelitaApplicationId) {
      log.error('No JELITA Application ID provided');
      testsFailed++;
      return false;
    }
    
    const response = await fetch(`${BASE_URL}/api/oss/jelita/${jelitaApplicationId}`);
    const data = await response.json();
    
    if (response.status === 200 && data.success) {
      log.success(`Submission found for JELITA App #${jelitaApplicationId}`);
      log.info(`Status: ${data.data.status}`);
      log.info(`NIB: ${data.data.ossNIB || 'Pending'}`);
      testsPassed++;
      return true;
    } else {
      log.error('JELITA ID lookup failed');
      testsFailed++;
      return false;
    }
  } catch (error) {
    log.error(`JELITA ID lookup error: ${error.message}`);
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
    const response = await fetch(`${BASE_URL}/api/oss/list?limit=5`);
    const data = await response.json();
    
    if (response.status === 200 && data.success && Array.isArray(data.data)) {
      log.success(`Found ${data.pagination.total} submissions (showing ${data.data.length})`);
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
 * Test 8: Duplicate Submission Prevention
 */
async function testDuplicatePrevention(jelitaApplicationId) {
  log.test('Test 8: Duplicate Submission Prevention');
  try {
    if (!jelitaApplicationId) {
      log.error('No JELITA Application ID provided');
      testsFailed++;
      return false;
    }
    
    const duplicateApplication = {
      jelitaApplicationId,
      applicationData: {
        pemohonNama: 'Duplicate Test',
        pemohonNIK: '3201234567890123',
        usahaNama: 'Test',
        usahaAlamat: 'Test',
        kbliKode: '47911',
        izinJenis: 'Test'
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/oss/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicateApplication)
    });
    
    const data = await response.json();
    
    if (response.status === 409 && !data.success) {
      log.success('Duplicate submission correctly prevented');
      log.info(`Message: ${data.message}`);
      testsPassed++;
      return true;
    } else {
      log.error('Should have prevented duplicate submission');
      testsFailed++;
      return false;
    }
  } catch (error) {
    log.error(`Duplicate prevention test error: ${error.message}`);
    testsFailed++;
    return false;
  }
}

/**
 * Test 9: Status Progression (Wait 35 seconds)
 */
async function testStatusProgression(trackingId) {
  log.test('Test 9: Status Progression (Waiting 35 seconds)');
  try {
    if (!trackingId) {
      log.error('No tracking ID provided');
      testsFailed++;
      return false;
    }
    
    log.info('Waiting 35 seconds for status to progress to SELESAI...');
    await sleep(35000);
    
    const response = await fetch(`${BASE_URL}/api/oss/status/${trackingId}`);
    const data = await response.json();
    
    if (response.status === 200 && data.data.status === 'SELESAI') {
      log.success(`Status progressed to SELESAI as expected`);
      log.info(`Completed at: ${data.data.completedAt}`);
      testsPassed++;
      return true;
    } else {
      log.error(`Status should be SELESAI, got: ${data.data?.status}`);
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
 * Main test runner
 */
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 OSS Integration End-to-End Tests');
  console.log('='.repeat(60));
  console.log('');
  
  // Test 1: Health check
  await testHealthCheck();
  console.log('');
  
  // Test 2: OSS health
  await testOSSHealth();
  console.log('');
  
  // Test 3: Submit application
  const submissionResult = await testSubmitApplication();
  console.log('');
  
  // Test 4: Invalid submission
  await testSubmitInvalidApplication();
  console.log('');
  
  if (submissionResult.success) {
    // Test 5: Check status
    await testCheckStatus(submissionResult.trackingId);
    console.log('');
    
    // Test 6: Check by JELITA ID
    await testCheckByJelitaId(submissionResult.jelitaApplicationId);
    console.log('');
    
    // Test 7: List submissions
    await testListSubmissions();
    console.log('');
    
    // Test 8: Duplicate prevention
    await testDuplicatePrevention(submissionResult.jelitaApplicationId);
    console.log('');
    
    // Test 9: Status progression (35 seconds)
    await testStatusProgression(submissionResult.trackingId);
    console.log('');
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`${colors.green}✅ Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testsFailed}${colors.reset}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log('='.repeat(60));
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log.error(`Test runner error: ${error.message}`);
  process.exit(1);
});
