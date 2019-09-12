// @flow strict

import type { Producer } from '../types';
import type { Logger } from 'pino';
const { Server, ServerCredentials, status } = require('grpc');
const { ClickRoad } = require('../proto/clickroad-public');
const { MetricMessage } = require('../proto/clickroad-private');
const getOrCreateContextId = require('../utils/context-id');

type Config = {
  logger: Logger,
  producer: Producer,
  trustProxy: boolean,
};

function createGrpcServer({ logger, producer }: Config) {
  const server = new Server();

  server.addService(ClickRoad.service, {
    trackEvent(call, callback) {
      const ip = call.metadata.get('x-forwarded-for')[0] || '0.0.0.0';
      const cid = getOrCreateContextId(
        call.request.cid && call.request.cid.value,
      );

      const messages = call.request.metrics.map((metric) =>
        MetricMessage.create({
          ip,
          cid,
          metric,
        }),
      );

      producer
        .produce(messages)
        .then(() => callback(null, { cid }))
        .catch((error) => {
          logger.error(error);
          callback({ code: 500, status: status.INTERNAL });
        });
    },
  });

  return {
    async listen({ host, port }: { host: string, port: number }) {
      server.bind(`${host}:${port}`, ServerCredentials.createInsecure());
      server.start();
    },
    async stop() {
      await new Promise((resolve) => server.tryShutdown(resolve));
    },
  };
}

module.exports = createGrpcServer;
