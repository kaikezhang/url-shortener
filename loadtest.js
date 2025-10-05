#!/usr/bin/env node

const autocannon = require('autocannon');

// Configuration
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';
const RATE = parseInt(process.env.RATE || '100', 10); // requests per second
const DURATION = parseInt(process.env.DURATION || '10', 10); // seconds
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '10', 10);

const TEST_SCENARIOS = {
  health: {
    url: `${TARGET_URL}/api/health`,
    method: 'GET',
  },
  metrics: {
    url: `${TARGET_URL}/api/metrics`,
    method: 'GET',
  },
  shorten: {
    url: `${TARGET_URL}/api/shorten`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: 'https://github.com/kaikezhang',
    }),
  },
};

// Get scenario from command line
const scenario = process.argv[2] || 'health';

if (!TEST_SCENARIOS[scenario]) {
  console.error(`Unknown scenario: ${scenario}`);
  console.error(`Available scenarios: ${Object.keys(TEST_SCENARIOS).join(', ')}`);
  process.exit(1);
}

const config = TEST_SCENARIOS[scenario];

console.log(`🚀 Starting load test...`);
console.log(`   Target: ${config.url}`);
console.log(`   Method: ${config.method}`);
console.log(`   Rate: ${RATE} req/s`);
console.log(`   Duration: ${DURATION}s`);
console.log(`   Connections: ${CONNECTIONS}`);
console.log('');

const instance = autocannon({
  url: config.url,
  method: config.method,
  headers: config.headers,
  body: config.body,
  connections: CONNECTIONS,
  duration: DURATION,
  rate: RATE,
  pipelining: 1,
}, (err, result) => {
  if (err) {
    console.error('❌ Load test failed:', err);
    process.exit(1);
  }

  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`Total Requests: ${result.requests.total}`);
  console.log(`Total Duration: ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`Requests/sec: ${result.requests.average.toFixed(2)}`);
  console.log(`Latency (avg): ${result.latency.mean.toFixed(2)}ms`);
  console.log(`Latency (p50): ${result.latency.p50}ms`);
  console.log(`Latency (p95): ${result.latency.p95}ms`);
  console.log(`Latency (p99): ${result.latency.p99}ms`);
  console.log(`Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Timeouts: ${result.timeouts}`);
  console.log(`Non-2xx responses: ${result.non2xx}`);

  if (result.errors > 0 || result.timeouts > 0) {
    console.log('\n⚠️  Test completed with errors');
    process.exit(1);
  } else {
    console.log('\n✅ Test completed successfully');
  }
});

// Show progress
autocannon.track(instance, {
  renderProgressBar: true,
  renderResultsTable: false,
  renderLatencyTable: false,
});

// Handle Ctrl+C
process.once('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  instance.stop();
});
