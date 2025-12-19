/**
 * OSS-RBA Client
 * 
 * Handles communication with OSS-RBA platform with:
 * - Retry logic
 * - Circuit breaker pattern
 * - Timeout handling
 * - Error transformation
 */

const axios = require('axios');
require('dotenv').config();

// Circuit breaker state
let circuitBreakerState = {
  failures: 0,
  lastFailureTime: null,
  isOpen: false
};

const CIRCUIT_BREAKER_THRESHOLD = parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5;
const CIRCUIT_BREAKER_TIMEOUT = parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 60000; // 60s
const CIRCUIT_BREAKER_RESET_TIMEOUT = parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT) || 30000; // 30s

/**
 * Check if circuit breaker should reset
 */
const checkCircuitBreaker = () => {
  if (!circuitBreakerState.isOpen) return true;
  
  const timeSinceLastFailure = Date.now() - circuitBreakerState.lastFailureTime;
  
  if (timeSinceLastFailure > CIRCUIT_BREAKER_RESET_TIMEOUT) {
    console.log('🔄 Circuit breaker: Attempting reset...');
    circuitBreakerState.isOpen = false;
    circuitBreakerState.failures = 0;
    return true;
  }
  
  return false;
};

/**
 * Record circuit breaker failure
 */
const recordFailure = () => {
  circuitBreakerState.failures++;
  circuitBreakerState.lastFailureTime = Date.now();
  
  if (circuitBreakerState.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerState.isOpen = true;
    console.error(`🔴 Circuit breaker OPEN after ${circuitBreakerState.failures} failures`);
  }
};

/**
 * Record circuit breaker success
 */
const recordSuccess = () => {
  if (circuitBreakerState.failures > 0) {
    console.log('✅ Circuit breaker: Resetting failure count');
  }
  circuitBreakerState.failures = 0;
  circuitBreakerState.lastFailureTime = null;
};

/**
 * OSS-RBA API Client
 */
const ossClient = axios.create({
  baseURL: process.env.OSS_RBA_BASE_URL || 'http://localhost:4000',
  timeout: parseInt(process.env.OSS_RBA_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'JELITA-Gateway/1.0'
  }
});

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Submit application to OSS-RBA
 * 
 * @param {Object} applicationData - Application data to submit
 * @param {Object} options - Submission options (retries, timeout, etc.)
 * @returns {Promise<Object>} OSS-RBA response
 */
const submitApplication = async (applicationData, options = {}) => {
  const maxRetries = options.retries || parseInt(process.env.OSS_RBA_RETRY_ATTEMPTS) || 3;
  const retryDelay = options.retryDelay || parseInt(process.env.OSS_RBA_RETRY_DELAY) || 1000;
  
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    throw new Error('Circuit breaker is OPEN - OSS-RBA service temporarily unavailable');
  }
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Submitting to OSS-RBA (attempt ${attempt}/${maxRetries})...`);
      
      const response = await ossClient.post('/api/v1/perizinan/submit', applicationData);
      
      // Success - record and return
      recordSuccess();
      console.log(`✅ OSS-RBA submission successful: ${response.data.data?.trackingId}`);
      
      return {
        success: true,
        data: response.data.data,
        trackingId: response.data.data?.trackingId,
        nib: response.data.data?.nib,
        status: response.data.data?.statusPengajuan,
        rawResponse: response.data
      };
      
    } catch (error) {
      lastError = error;
      console.error(`❌ OSS-RBA submission failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Don't retry on validation errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        recordFailure();
        throw {
          success: false,
          error: 'Validation error',
          message: error.response.data?.message || error.message,
          errors: error.response.data?.errors || [],
          statusCode: error.response.status
        };
      }
      
      // Retry on network/server errors (5xx)
      if (attempt < maxRetries) {
        const delay = retryDelay * attempt; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  // All retries exhausted
  recordFailure();
  throw {
    success: false,
    error: 'Max retries exhausted',
    message: lastError?.message || 'Failed to submit to OSS-RBA',
    attempts: maxRetries
  };
};

/**
 * Check submission status
 * 
 * @param {string} trackingId - OSS-RBA tracking ID
 * @returns {Promise<Object>} Status information
 */
const checkStatus = async (trackingId) => {
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    throw new Error('Circuit breaker is OPEN - OSS-RBA service temporarily unavailable');
  }
  
  try {
    console.log(`📊 Checking OSS-RBA status: ${trackingId}`);
    
    const response = await ossClient.get(`/api/v1/perizinan/status/${trackingId}`);
    
    recordSuccess();
    
    return {
      success: true,
      data: response.data.data,
      status: response.data.data?.statusPengajuan,
      nib: response.data.data?.nib,
      rawResponse: response.data
    };
    
  } catch (error) {
    console.error(`❌ OSS-RBA status check failed:`, error.message);
    
    if (error.response && error.response.status === 404) {
      return {
        success: false,
        error: 'Not found',
        message: 'Tracking ID not found in OSS-RBA system',
        statusCode: 404
      };
    }
    
    recordFailure();
    throw {
      success: false,
      error: 'Status check failed',
      message: error.message,
      statusCode: error.response?.status || 500
    };
  }
};

/**
 * Get submission by NIB
 * 
 * @param {string} nib - Nomor Induk Berusaha
 * @returns {Promise<Object>} Submission details
 */
const getByNIB = async (nib) => {
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    throw new Error('Circuit breaker is OPEN - OSS-RBA service temporarily unavailable');
  }
  
  try {
    console.log(`🔍 Fetching OSS-RBA data by NIB: ${nib}`);
    
    const response = await ossClient.get(`/api/v1/perizinan/nib/${nib}`);
    
    recordSuccess();
    
    return {
      success: true,
      data: response.data.data,
      rawResponse: response.data
    };
    
  } catch (error) {
    console.error(`❌ OSS-RBA NIB lookup failed:`, error.message);
    
    if (error.response && error.response.status === 404) {
      return {
        success: false,
        error: 'Not found',
        message: 'NIB not found in OSS-RBA system',
        statusCode: 404
      };
    }
    
    recordFailure();
    throw {
      success: false,
      error: 'NIB lookup failed',
      message: error.message,
      statusCode: error.response?.status || 500
    };
  }
};

/**
 * Health check OSS-RBA service
 */
const healthCheck = async () => {
  try {
    const response = await ossClient.get('/health', { timeout: 5000 });
    recordSuccess();
    return {
      success: true,
      status: response.data.status,
      service: response.data.service,
      circuitBreaker: {
        isOpen: circuitBreakerState.isOpen,
        failures: circuitBreakerState.failures
      }
    };
  } catch (error) {
    recordFailure();
    return {
      success: false,
      error: error.message,
      circuitBreaker: {
        isOpen: circuitBreakerState.isOpen,
        failures: circuitBreakerState.failures
      }
    };
  }
};

/**
 * Get circuit breaker status
 */
const getCircuitBreakerStatus = () => {
  return {
    isOpen: circuitBreakerState.isOpen,
    failures: circuitBreakerState.failures,
    lastFailureTime: circuitBreakerState.lastFailureTime,
    threshold: CIRCUIT_BREAKER_THRESHOLD
  };
};

module.exports = {
  submitApplication,
  checkStatus,
  getByNIB,
  healthCheck,
  getCircuitBreakerStatus
};
