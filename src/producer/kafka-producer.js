// @flow strict

import type { Producer, Serializer } from '../types';
const { Kafka } = require('kafkajs');
const _ = require('lodash');
const { MetricMessage } = require('../proto/clickroad-private');

type Config = {
  topicPrefix: string,
  brokers: Array<string>,
  clientId: string,
  serializer: Serializer,
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

      const topicMessages = _(messages)
        .map((message) => config.serializer.serialize(message))
        .groupBy('type')
        .mapValues((messages) => _.map(messages, 'payload'))
        .mapValues((messages, topic) => ({
          topic: config.topicPrefix + topic,
          messages: messages,
        }))
        .values()
        .value();

      await producer.sendBatch({ topicMessages });
    },
    async stop() {
      await producer.disconnect();
    },
  };
}

module.exports = createKafkaProducer;
