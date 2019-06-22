// @flow strict

const parseEnv = require('env-schema');
const configSchema = require('./config-schema.json');
const createServer = require('./server');

const config = parseEnv(configSchema);

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
