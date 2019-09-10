// @flow strict

import type { Producer, Serializer } from '../types';
const { Kafka } = require('kafkajs');
const map = require('lodash/fp/map');
const flow = require('lodash/fp/flow');
const values = require('lodash/fp/values');
const groupBy = require('lodash/fp/groupBy');
const mapValues = require('lodash/fp/mapValues');
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

      const topicMessages = flow(
        map((message) => config.serializer.serialize(message)),
        groupBy('type'),
        mapValues(map('payload')),
        mapValues((values, topic) => ({
          topic: config.topicPrefix + topic,
          messages: values.map((value) => ({ value })),
        })),
        values(),
      )(messages);

      await producer.sendBatch({ topicMessages });
    },
    async stop() {
      await producer.disconnect();
    },
  };
}

module.exports = createKafkaProducer;
