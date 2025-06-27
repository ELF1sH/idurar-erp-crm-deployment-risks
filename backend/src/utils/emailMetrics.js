const client = require('prom-client');
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Request counter - track how many times the endpoint is called
const emailCounter = new client.Counter({
  name: 'email_endpoint_requests_total',
  help: 'Total number of requests to the email endpoint',
  labelNames: ['status_code', 'user_type'] // Add relevant labels
});
register.registerMetric(emailCounter);

// Request duration - track how long the endpoint takes to respond
const emailDuration = new client.Histogram({
  name: 'email_endpoint_duration_seconds',
  help: 'Duration of email endpoint requests in seconds',
  labelNames: ['status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5] // Define buckets in seconds
});
register.registerMetric(emailDuration);

// Request size - track the size of request payloads
const emailRequestSize = new client.Histogram({
  name: 'email_endpoint_request_size_bytes',
  help: 'Size of requests to the email endpoint in bytes',
  labelNames: [],
  buckets: [100, 500, 1000, 5000, 10000, 50000]
});
register.registerMetric(emailRequestSize);

// Response size - track the size of response payloads
const emailResponseSize = new client.Histogram({
  name: 'email_endpoint_response_size_bytes',
  help: 'Size of responses from the email endpoint in bytes',
  labelNames: ['status_code'],
  buckets: [100, 500, 1000, 5000, 10000, 50000]
});
register.registerMetric(emailResponseSize);

// Error counter - track email errors that occur
const emailErrors = new client.Counter({
  name: 'email_endpoint_errors_total',
  help: 'Total number of errors in the email endpoint',
  labelNames: ['error_type', 'error_code']
});
register.registerMetric(emailErrors);

// Business metrics - track business-email outcomes
const emailBusinessMetric = new client.Counter({
  name: 'email_endpoint_business_outcome_total',
  help: 'Business outcomes from the email endpoint',
  labelNames: ['outcome'] // e.g., 'success', 'partial_success', 'validation_failed'
});
register.registerMetric(emailBusinessMetric);

// In-progress requests - track concurrent requests
const emailInProgress = new client.Gauge({
  name: 'email_endpoint_in_progress',
  help: 'Number of in-progress requests to the email endpoint',
  labelNames: []
});
register.registerMetric(emailInProgress);

// Export all metrics
module.exports = {
  register,
  metrics: {
    emailCounter,
    emailDuration,
    emailRequestSize,
    emailResponseSize,
    emailErrors,
    emailBusinessMetric,
    emailInProgress
  }
};
