const promBundle = require('express-prom-bundle');
const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
client.collectDefaultMetrics({ register });

// Create a histogram to measure HTTP request duration
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

// Register the histogram
register.registerMetric(httpRequestDurationMicroseconds);

// Create middleware to use in your express app
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  promRegistry: register
});

module.exports = {
  metricsMiddleware,
  register,
  httpRequestDurationMicroseconds
};
