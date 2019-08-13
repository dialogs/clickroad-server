// @flow strict

import type { Deserializer } from '../types';
const { Kafka } = require('kafkajs');
const { MetricMessage } = require('../proto/clickroad-private');

function createProtoDeserializer(): Deserializer {
  return {
    deserialize(message: Buffer): MetricMessage {
      return MetricMessage.decode(message);
    },
  };
}

module.exports = createProtoDeserializer;
