const winston = require('winston');
const LokiTransport = require('winston-loki');
const path = require('path');
const fs = require('fs');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'backend' },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // Loki logging
    new LokiTransport({
      host: process.env.LOKI_HOST || 'http://loki:3100',
      labels: { job: 'backend' },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => console.error(err)
    })
  ]
});

module.exports = logger;
