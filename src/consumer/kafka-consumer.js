// @flow strict

import type { Consumer, Persister, Deserializer } from '../types';
const { Kafka } = require('kafkajs');
const { MetricMessage } = require('../proto/clickroad-private');

type Config = {
  topic: string,
  groupId: string,
  clientId: string,
  brokers: Array<string>,
  persister: Persister,
  deserializer: Deserializer,
};

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
      const metric = config.deserializer.deserialize(message.value);

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
