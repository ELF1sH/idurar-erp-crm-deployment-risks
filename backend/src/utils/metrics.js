const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({
  register,
  prefix: 'nodejs_'
});

// HTTP request duration histogram
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10]
});
register.registerMetric(httpRequestDurationMicroseconds);

// Request counter
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestCounter);

// Error counter
const errorCounter = new client.Counter({
  name: 'app_error_count',
  help: 'Count of errors by type',
  labelNames: ['error_type', 'route']
});
register.registerMetric(errorCounter);

// Database operation duration
const dbOperationDuration = new client.Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2.5]
});
register.registerMetric(dbOperationDuration);

// Memory usage gauge
const memoryGauge = new client.Gauge({
  name: 'app_memory_usage_bytes',
  help: 'Application memory usage in bytes',
  labelNames: ['type']
});
register.registerMetric(memoryGauge);

// Update memory metrics every 5 seconds
setInterval(() => {
  const memory = process.memoryUsage();
  memoryGauge.set({ type: 'rss' }, memory.rss);
  memoryGauge.set({ type: 'heapTotal' }, memory.heapTotal);
  memoryGauge.set({ type: 'heapUsed' }, memory.heapUsed);
  memoryGauge.set({ type: 'external' }, memory.external);
}, 5000);

// API route counter (active requests)
const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
  labelNames: ['method']
});
register.registerMetric(activeRequests);

// Middleware to measure HTTP requests
function metricsMiddleware(req, res, next) {
  // Skip metrics endpoint to avoid infinite recursion
  if (req.path === '/metrics') {
    return next();
  }

  // Increment active requests counter
  activeRequests.inc({ method: req.method });

  // Record start time
  const start = Date.now();

  // Define route for grouping similar URLs
  let route = req.originalUrl;

  // Add response handler
  res.on('finish', () => {
    // Calculate request duration
    const duration = (Date.now() - start) / 1000; // in seconds

    // Record duration
    httpRequestDurationMicroseconds.observe(
      { method: req.method, route: route, status_code: res.statusCode },
      duration
    );

    // Increment request counter
    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });

    // Decrement active requests counter
    activeRequests.dec({ method: req.method });
  });

  next();
}

// Metrics endpoint setup
function setupMetricsEndpoint(app) {
  app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });
}

module.exports = {
  metricsMiddleware,
  register,
  errorCounter,
  setupMetricsEndpoint
};
