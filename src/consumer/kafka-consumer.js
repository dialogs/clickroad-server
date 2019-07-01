// @flow strict

import type { Consumer, Persister } from '../types';
const { Kafka } = require('kafkajs');
const { MetricMessage } = require('../proto/clickroad-private');

type Config = {
  topic: string,
  groupId: string,
  clientId: string,
  brokers: Array<string>,
  persister: Persister,
};

const deserialize = (message: Buffer) => JSON.parse(message.toString('utf-8'));

async function createKafkaConsumer(config: Config): Promise<Consumer> {
  const kafka = new Kafka({
    clientId: config.clientId,
    brokers: config.brokers,
  });

  const consumer = kafka.consumer({
    groupId: config.groupId,
  });

  await consumer.connect();
  await consumer.subscribe({
    topic: config.topic,
  });

  await consumer.run({
    partitionsConsumedConcurrently: 100,
    async eachMessage({ message }) {
      const metric = MetricMessage.decode(message.value);

      await config.persister.persist(metric);
    },
  });

  return {
    async stop() {
      await consumer.disconnect();
    },
  };
}

module.exports = createKafkaConsumer;