// @flow strict

import type { Producer } from '../types';
const fastify = require('fastify');
const fastifyCors = require('fastify-cors');
const fastifyHelmet = require('fastify-helmet');
const fastifyPrometheus = require('fastify-metrics');
const getOrCreateContextId = require('../utils/context-id');
const { metricMessageFromJson } = require('../proto/clickroad-private');

type Config = {
  producer: Producer,
  trustProxy: boolean,
};

function createRestServer(config: Config) {
  const app = fastify({
    trustProxy: config.trustProxy,
  });

  app.register(fastifyCors, {});
  app.register(fastifyHelmet, {});
  app.register(fastifyPrometheus, { endpoint: '/metrics' });

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
