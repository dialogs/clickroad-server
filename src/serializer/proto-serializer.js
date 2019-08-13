// @flow strict

import type { Serializer } from '../types';
const { Kafka } = require('kafkajs');
const { MetricMessage } = require('../proto/clickroad-private');

function createProtoSerializer(): Serializer {
  return {
    serialize(message: MetricMessage): Buffer {
      return MetricMessage.encode(message).finish();
    },
  };
}

module.exports = createProtoSerializer;
