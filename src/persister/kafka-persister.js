// @flow strict

import type { Persister, Serializer } from '../types';
import type { MetricMessage } from '../proto/clickroad-private';
const { Kafka } = require('kafkajs');
const { unpackValue, msFromTimestamp } = require('../proto/utils');

type Config = {
  topic: string,
  clientId: string,
  brokers: Array<string>,
  serializer: Serializer,
};

async function createKafkaPersister(config: Config): Promise<Persister> {
  const kafka = new Kafka({
    brokers: config.brokers,
    clientId: config.clientId,
  });

  const producer = kafka.producer();

  return {
    async persist(message: MetricMessage) {
      await producer.connect();
      await producer.send({
        topic: config.topic,
        messages: [config.serializer.serialize(message)],
      });
    },
    async stop() {
      await producer.disconnect();
    },
  };
}

module.exports = createKafkaPersister;
