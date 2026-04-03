const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { trace, context, diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const config = require('../config/env.js');

// Configure diagnostics (silence noisy console logs by default)
// Use LOG_LEVEL=debug to enable detailed otel diagnostics, otherwise keep NONE
const diagLevel = (config.LOG_LEVEL || '').toLowerCase() === 'debug' ? DiagLogLevel.DEBUG : DiagLogLevel.NONE;
diag.setLogger(new DiagConsoleLogger(), diagLevel);

const getPeerServiceName = (hostname) => {
  if (!hostname) return undefined;
  const h = String(hostname).toLowerCase();
  if (h.includes('vault')) return 'vault';
  if (h.includes('opensearch')) return 'opensearch';
  if (h.includes('sonar') || h.startsWith('sonar-')) return 'sonarqube';
  if (h.includes('n8n')) return 'n8n';
  return hostname;
};

// Initialize the OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.NODE_ENV || 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: config.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        requestHook: (span, request) => {
          if (!span || !request) return;

          let host;
          try {
            if (typeof request.getHeader === 'function') {
              host = request.getHeader('host');
            }
            if (!host && request?.host) host = request.host;
            if (!host && request?.hostname) host = request.hostname;
            if (!host && request?.headers?.host) host = request.headers.host;
          } catch (e) {
            host = undefined;
          }

          if (typeof host === 'string' && host.includes(':')) {
            host = host.split(':')[0];
          }

          const peerService = getPeerServiceName(host);
          if (peerService) {
            span.setAttribute('peer.service', peerService);
          }
        },
      },
    }),
  ],
});

// Start the SDK
sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

// Export utilities for manual tracing
const tracer = trace.getTracer(config.SERVICE_NAME);

const createChildSpan = (name, parentSpan) => {
  const span = tracer.startSpan(name, parentSpan ? { links: [{ context: parentSpan }] } : {});
  return span;
};

const traceMiddleware = (req, res, next) => {
  // Extract incoming trace context from headers
  const incomingTraceHeader = req.headers['traceparent'];
  const incomingContext = incomingTraceHeader ? 
    trace.extract(context.active(), { getHeader: (key) => key === 'traceparent' ? incomingTraceHeader : undefined }) : 
    context.active();
    
  const span = tracer.startSpan(`${req.method} ${req.path}`, {
    kind: 1, // SERVER
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.target': req.path,
      'http.host': req.get('host'),
      'user.agent': req.get('user-agent'),
      'http.status_code': res.statusCode,
      'user.id': req.user?.userId || 'anonymous',
      'client.ip': req.ip || req.connection.remoteAddress,
    },
  }, incomingContext);

  context.with(trace.setSpan(context.active(), span), () => {
    res.on('finish', () => {
      span.setAttributes({
        'http.status_code': res.statusCode,
      });
      span.end();
    });
    next();
  });
};

module.exports = {
  tracer,
  createChildSpan,
  traceMiddleware,
  trace,
  context,
};
