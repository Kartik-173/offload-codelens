// Initialize OpenTelemetry first
require('./utils/tracing');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { httpLogger, ErrorhttpLogger } = require('./middlewares/httpLogger');
const { errorResponse } = require('./middlewares/errorHandlers');
const cognitoAuthMiddleware = require('./middlewares/cognitoAuthMiddleware');
const router = require('./routers');
const serviceMonitor = require('./utils/serviceMonitor');

const app = express();
const cors = require('cors');

app.use(cors());
app.use(cookieParser());
app.use(compression());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint (public)
app.use('/healthcheck', (req, res) => {
  res.send({ data: { message: 'Ok', versionTag: process.env.npm_package_version, serviceName: process.env.npm_package_name } });
});

// Service connection status endpoint (public)
app.get('/service-status', (req, res) => {
  const status = serviceMonitor.getStatus();
  
  const formattedStatus = {};
  Object.keys(status).forEach(service => {
    const serviceStatus = status[service];
    formattedStatus[service] = {
      status: serviceStatus.isHealthy ? 'up' : 'down',
      isHealthy: serviceStatus.isHealthy,
      lastCheck: serviceStatus.lastCheck,
      url: serviceStatus.url,
      error: serviceStatus.error,
      duration: `${serviceStatus.duration}ms`
    };
  });
  
  res.send({
    data: {
      services: formattedStatus
    }
  });
});

// Prometheus metrics endpoint (public)
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// ADD logging middleware
app.use(httpLogger);
app.use(ErrorhttpLogger);

// Apply Cognito authentication middleware to all API routes
app.use(cognitoAuthMiddleware);

app.get('/test', (req, res) => {
  req.log?.info({ message: 'Test endpoint called' }, 'Test endpoint accessed');
  res.send({ data: { message: 'Backend working', versionTag: process.env.npm_package_version} });
});

app.use('/api', router);
app.use(errorResponse);

// Start service connection monitoring
serviceMonitor.start(30); // Check every 30 seconds



process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  serviceMonitor.stop();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  serviceMonitor.stop();
  
  process.exit(0);
});

module.exports = app;
