// @flow strict

const path = require('path');
const protobuf = require('protobufjs');
const Long = require('long');
const { packValue, timestampFromMs } = require('./utils');

const root = protobuf.loadSync(
  path.resolve(__dirname, '../../proto/clickroad-private.proto'),
);

const MetricMessage = root.lookupType('clickroad.MetricMessage');

function metricMessageFromJson(cid: string, ip: string, json: Array<any>) {
  const [type, clientTime] = json;
  const time = timestampFromMs(clientTime);

  switch (type) {
    case 'context': {
      const [, , payload] = json;
      const context = {};
      Object.keys(payload).forEach((key) => {
        context[key] = String(payload[key]);
      });

      return MetricMessage.create({
        ip,
        cid,
        metric: {
          time,
          context: { context },
        },
      });
    }
    case 'screenview': {
      const [, , name, source, url] = json;
      return MetricMessage.create({
        ip,
        cid,
        metric: {
          time,
          screenView: {
            name,
            source: packValue(source),
            url: packValue(url),
          },
        },
      });
    }
    case 'event': {
      const [, , category, action, label, value] = json;
      return MetricMessage.create({
        ip,
        cid,
        metric: {
          time,
          event: {
            category,
            action,
            label: packValue(label),
            value: packValue(value),
          },
        },
      });
    }
    case 'timing': {
      const [, , category, variable, timingTime, label] = json;
      return MetricMessage.create({
        ip,
        cid,
        metric: {
          time,
          timing: {
            category,
            variable,
            time: Long.fromNumber(timingTime),
            label: packValue(label),
          },
        },
      });
    }
    case 'social': {
      const [, , network, action, target] = json;
      return MetricMessage.create({
        ip,
        cid,
        metric: {
          time,
          social: { network, action, target },
        },
      });
    }
    case 'error': {
      const [, , message, fatal] = json;
      return MetricMessage.create({
        ip,
        cid,
        metric: {
          time,
          error: { message, fatal },
        },
      });
    }
    default:
      throw new Error(`Unexpected metric type: ${type}`);
  }
}

module.exports = {
  metricMessageFromJson,
  MetricMessage: root.lookupType('clickroad.MetricMessage'),
};
