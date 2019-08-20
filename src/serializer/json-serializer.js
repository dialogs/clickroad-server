// @flow strict

import type { Serializer } from '../types';
const { Kafka } = require('kafkajs');
const { MetricMessage } = require('../proto/clickroad-private');
const { timestamp, unpackValue, msFromTimestamp } = require('../proto/utils');

function mapMetric({ metric }: MetricMessage) {
  if (metric.context) {
    const { context } = metric.context;

    return {
      type: 'context',
      payload: context,
    };
  } else if (metric.screenView) {
    const { name, source, url } = metric.screenView;

    return {
      type: 'screen_view',
      payload: {
        name,
        source: unpackValue(source),
        url: unpackValue(url),
      },
    };
  } else if (metric.event) {
    const { category, action, label, value } = metric.event;

    return {
      type: 'event',
      payload: {
        category,
        action,
        label: unpackValue(label),
        value: unpackValue(value),
      },
    };
  } else if (metric.timing) {
    const { category, variable, time, label } = metric.timing;

    return {
      type: 'timing',
      payload: {
        category,
        variable,
        time: time.toString(),
        label: unpackValue(label),
      },
    };
  } else if (metric.social) {
    const { network, action, target } = metric.social;

    return {
      type: 'social',
      payload: {
        network,
        action,
        target,
      },
    };
  } else if (metric.error) {
    const { message, fatal } = metric.error;

    return {
      type: 'error',
      payload: {
        message,
        fatal,
      },
    };
  } else {
    return {
      type: 'unknown',
      payload: metric,
    };
  }
}

function createJsonSerializer(): Serializer {
  return {
    serialize({ cid, ip, metric }: MetricMessage): Buffer {
      return Buffer.from(
        JSON.stringify({
          ip,
          cid,
          serverTime: timestamp(Date.now()),
          clientTime: timestamp(msFromTimestamp(metric.time)),
          metric: mapMetric({ metric }),
        }),
      );
    },
  };
}

module.exports = createJsonSerializer;
