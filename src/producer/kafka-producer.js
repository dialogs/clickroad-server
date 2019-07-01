// @flow strict

import type { Producer } from '../types';
const { Kafka } = require('kafkajs');
const { MetricMessage } = require('../proto/clickroad-private');

type Config = {
  topic: string,
  brokers: Array<string>,
  clientId: string,
};

function createKafkaProducer(config: Config): Producer {
  const kafka = new Kafka({
    brokers: config.brokers,
    clientId: config.clientId,
  });

  const producer = kafka.producer();

  return {
    async produce(messages) {
      await producer.connect();
      await producer.send({
        topic: config.topic,
        messages: messages.map((message) => {
          return {
            value: MetricMessage.encode(message).finish(),
          };
        }),
      });
    },
    async stop() {
      await producer.disconnect();
    },
  };
}

module.exports = createKafkaProducer;
