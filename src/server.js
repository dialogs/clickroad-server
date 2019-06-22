// @flow strict

const Promise = require('bluebird');
const fastify = require('fastify');
const fastifyPrometheus = require('fastify-metrics');
const { Producer } = require('node-rdkafka');

type Config = {
  kafka: {
    topic: string,
    brokerList: string,
    pollInterval: number,
    flushTimeout: number,
  },
};

function createServer(config: Config) {
  const app = fastify({
    logger: true,
  });

  app.register(fastifyPrometheus, { endpoint: '/metrics' });

  const producer = Promise.promisifyAll(
    new Producer({
      dr_cb: true,
      'client.id': 'clickroad',
      'metadata.broker.list': config.kafka.brokerList,
    }),
  );

  producer.on('event.error', (error) => {
    app.log.error(error);
  });

  producer.setPollInterval(config.kafka.pollInterval);

  const serialize = (message) => Buffer.from(JSON.stringify(message));

  app.post('/rest/metrics', async (req, reply) => {
    if (!Array.isArray(req.body)) {
      reply.status(400);
      return { ok: false };
    }

    await producer.connectAsync({});
    for (const message of req.body) {
      producer.produce(
        config.kafka.topic,
        null,
        serialize(message),
        null,
        null,
        req.id,
      );
    }

    await producer.flushAsync(config.kafka.flushTimeout);

    return { ok: true };
  });

  return app;
}

module.exports = createServer;
