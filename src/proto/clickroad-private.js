// @flow strict

const path = require('path');
const protobuf = require('protobufjs');
const { timestampFromMs } = require('./timestamp');

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
      return MetricMessage.create({
        ip,
        cid,
        metric: {
          time,
          context: payload,
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
          screenView: { name, source, url },
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
          event: { category, action, label, value },
        },
      });
    }
    case 'timing': {
      const [, , category, variable, time, label] = json;
      return MetricMessage.create({
        ip,
        cid,
        metric: {
          time,
          timing: { category, variable, time, label },
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
