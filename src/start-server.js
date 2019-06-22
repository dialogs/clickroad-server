// @flow strict

const parseEnv = require('env-schema');
const createServer = require('./server');

const config = parseEnv({
  schema: {
    type: 'object',
    required: [
      'HOST',
      'PORT',
      'KAFKA_TOPIC',
      'KAFKA_BROKER_LIST',
      'KAFKA_POLL_INTERVAL',
      'KAFKA_FLUSH_TIMEOUT',
    ],
    properties: {
      HOST: {
        type: 'string',
        default: '0.0.0.0',
      },
      PORT: {
        type: 'number',
        default: 3000,
      },
      KAFKA_TOPIC: {
        type: 'string',
        default: 'metrics',
      },
      KAFKA_BROKER_LIST: {
        type: 'string',
        default: 'localhost:9092',
      },
      KAFKA_POLL_INTERVAL: {
        type: 'number',
        default: 100,
      },
      KAFKA_FLUSH_TIMEOUT: {
        type: 'number',
        default: 1000,
      },
    },
  },
});

const app = createServer({
  kafka: {
    topic: config.KAFKA_TOPIC,
    brokerList: config.KAFKA_BROKER_LIST,
    pollInterval: config.KAFKA_POLL_INTERVAL,
    flushTimeout: config.KAFKA_FLUSH_TIMEOUT,
  },
});

app.listen({ host: config.HOST, port: config.PORT }, (error) => {
  if (error) {
    app.log.error(error);
    process.exit(1);
  }
});

const errorEvents = ['uncaughtException', 'unhandledRejection'];
errorEvents.forEach((eventName) => {
  process.on(eventName, (error) => {
    app.log.error(error);
    process.exit(1);
  });
});
