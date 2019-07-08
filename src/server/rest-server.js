// @flow strict

import type { Logger } from 'pino';
import type { Producer } from '../types';
const fastify = require('fastify');
const fastifyCors = require('fastify-cors');
const fastifyHelmet = require('fastify-helmet');
const fastifyPrometheus = require('fastify-metrics');
const getOrCreateContextId = require('../utils/context-id');
const { metricMessageFromJson } = require('../proto/clickroad-private');

type Config = {
  logger: Logger,
  producer: Producer,
  trustProxy: boolean,
  enablePrometheus: boolean,
};

function createRestServer(config: Config) {
  const app = fastify({
    logger: config.logger,
    trustProxy: config.trustProxy,
  });

  app.register(fastifyCors, {});
  app.register(fastifyHelmet, {});
  if (config.enablePrometheus) {
    app.register(fastifyPrometheus, { endpoint: '/metrics' });
  }

  app.setErrorHandler((error, req, reply) => {
    req.log.error(error);
    reply.send({ ok: false });
  });

  app.post(
    '/rest/metrics',
    {
      schema: {
        body: {
          type: 'array',
          items: {
            type: 'array',
          },
        },
      },
      headers: {
        type: 'object',
        properties: {
          'x-context-id': { type: 'string' },
        },
      },
    },
    async (req, reply) => {
      const cid = getOrCreateContextId(req.headers['x-context-id']);
      const messages = req.body.map((metric) =>
        metricMessageFromJson(cid, req.ip, metric),
      );

      await config.producer.produce(messages);

      return { cid, ok: true };
    },
  );

  return app;
}

module.exports = createRestServer;
