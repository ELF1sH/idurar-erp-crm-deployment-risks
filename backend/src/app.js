const express = require('express');

const cors = require('cors');
const compression = require('compression');

const cookieParser = require('cookie-parser');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');
const {
  metricsMiddleware,
  register,
  errorCounter,
  setupMetricsEndpoint  } = require('./utils/metrics');
const logger = require('./utils/logger');

const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/appApi');

// create our Express app
const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(metricsMiddleware);
setupMetricsEndpoint(app);

// Error tracking middleware
app.use((err, req, res, next) => {
  errorCounter.inc({
    error_type: err.name || 'UnknownError',
    route: req.originalUrl
  });

  // Your existing error handling logic
  next(err);
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Middleware to log all requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: duration
    });
  });
  next();
});

app.use((err, req, res, next) => {
  logger.error(`Error processing request: ${err.message}`, {
    error: err.stack,
    method: req.method,
    url: req.originalUrl
  });

  res.status(500).json({ error: 'Internal Server Error' });
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());

app.use('/api', coreAuthRouter);
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/download', coreDownloadRouter);
app.use('/public', corePublicRouter);

app.use(errorHandlers.notFound);
app.use(errorHandlers.productionErrors);

module.exports = app;
