// @flow strict

import type { Serializer } from '../types';
const { Kafka } = require('kafkajs');
const { MetricMessage } = require('../proto/clickroad-private');

function createJsonSerializer(): Serializer {
  return {
    serialize(message: MetricMessage): Buffer {
      return Buffer.from(JSON.stringify(null));
    },
  };
}

module.exports = createJsonSerializer;
