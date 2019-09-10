// @flow strict

const pino = require('pino');
const {
  createRestServer,
  createGrpcServer,
  createKafkaProducer,
  createJsonSerializer,
  createProtoSerializer,
} = require('./index');
const config = require('./config');

const parseBrokerList = (raw: string) =>
  raw
    .split(',')
    .map((i) => i.trim())
    .filter(Boolean);

const logger = pino({
  name: 'clickroad',
  level: config.LOG_LEVEL,
});

function createSerializer() {
  switch (config.SERIALIZATION_MODE) {
    case 'json':
      return createJsonSerializer();
    default:
      return createProtoSerializer();
  }
}

async function startRestServer() {
  const serializer = createSerializer();
  const producer = createKafkaProducer({
    logger,
    serializer,
    topic: config.KAFKA_TOPIC,
    brokers: parseBrokerList(config.KAFKA_BROKER_LIST),
    clientId: config.KAFKA_CLIENT_ID,
  });

  const server = createRestServer({
    logger,
    producer,
    trustProxy: config.TRUST_PROXY,
    enablePrometheus: true,
  });

  await server.listen({ host: config.REST_HOST, port: config.REST_PORT });

  return () => Promise.all([server.close(), producer.stop()]);
}

async function startGrpcServer() {
  const serializer = createSerializer();
  const producer = createKafkaProducer({
    logger,
    serializer,
    topic: config.KAFKA_TOPIC,
    brokers: parseBrokerList(config.KAFKA_BROKER_LIST),
    clientId: config.KAFKA_CLIENT_ID,
  });

  const server = createGrpcServer({
    logger,
    producer,
    trustProxy: config.TRUST_PROXY,
  });

  await server.listen({ host: config.GRPC_HOST, port: config.GRPC_PORT });

  return () => Promise.all([server.stop(), producer.stop()]);
}

async function startUncaughtListener() {
  await new Promise((resolve, reject) => {
    const errorEvents = ['uncaughtException', 'unhandledRejection'];
    errorEvents.forEach((eventName) => {
      process.on(eventName, reject);
    });
  });

  return () => Promise.resolve();
}

const tasks = [startUncaughtListener()];

switch (config.MODE) {
  case 'all':
    tasks.push(startGrpcServer(), startRestServer());
    break;
  case 'grpc-server':
    tasks.push(startGrpcServer());
    break;
  case 'rest-server':
    tasks.push(startRestServer());
    break;
}

Promise.all(tasks)
  .then(async (teardown) => {
    await new Promise((resolve) => process.on('SIGINT', resolve));
    await Promise.all(teardown.map((fn) => fn()));
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });
