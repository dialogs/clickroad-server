const {
  MetricMessage,
  metricMessageFromJson,
} = require('../proto/clickroad-private');
const { unpackValue, msFromTimestamp } = require('../proto/utils');

const CID = '03fdaf7f-3c47-47a6-a256-d574bbf9c2b8';
const IP = '1.1.1.1';
const TIME = Date.now();

describe('json-to-proto-metric', () => {
  test.each([[{ appName: 'test' }], [{ foo: 1 }], [{ foo: null }]])(
    'should correctly parse "context" metrics context=%p',
    (context) => {
      const metric = metricMessageFromJson(CID, IP, ['context', TIME, context]);
      expect(MetricMessage.verify(metric)).toBeNull();

      const parsed = MetricMessage.decode(
        MetricMessage.encode(metric).finish(),
      );
      expect(parsed.ip).toBe(IP);
      expect(parsed.cid).toBe(CID);
      expect(msFromTimestamp(parsed.metric.time)).toBe(TIME);

      Object.keys(parsed.metric.context.context).forEach((key) => {
        expect(parsed.metric.context.context[key]).toBe(String(context[key]));
      });
    },
  );

  test.each([
    ['name', 'source', 'url'],
    ['name', 'source', null],
    ['name', null, 'url'],
    ['name', null, null],
  ])(
    'should correctly parse "screenview" metrics name=%p source=%p url=%p',
    (name, source, url) => {
      const metric = metricMessageFromJson(CID, IP, [
        'screenview',
        TIME,
        name,
        source,
        url,
      ]);
      expect(MetricMessage.verify(metric)).toBeNull();

      const bytes = MetricMessage.encode(metric).finish();
      const parsed = MetricMessage.decode(bytes);

      expect(parsed.ip).toBe(IP);
      expect(parsed.cid).toBe(CID);
      expect(msFromTimestamp(parsed.metric.time)).toBe(TIME);

      expect(parsed.metric.screenView.name).toBe(name);
      expect(unpackValue(parsed.metric.screenView.source)).toEqual(source);
      expect(unpackValue(parsed.metric.screenView.url)).toEqual(url);
    },
  );

  test.each([
    ['category', 'action', 'label', 1.5],
    ['category', 'action', 'label', 1.5],
    ['category', 'action', 'label', 0],
    ['category', 'action', 'label', null],
    ['category', 'action', null, 1.5],
    ['category', 'action', null, null],
  ])(
    'should correctly parse "event" metrics category=%p action=%p label=%p value=%p',
    (category, action, label, value) => {
      const metric = metricMessageFromJson(CID, IP, [
        'event',
        TIME,
        category,
        action,
        label,
        value,
      ]);
      expect(MetricMessage.verify(metric)).toBeNull();

      const bytes = MetricMessage.encode(metric).finish();
      const parsed = MetricMessage.decode(bytes);

      expect(parsed.ip).toBe(IP);
      expect(parsed.cid).toBe(CID);
      expect(msFromTimestamp(parsed.metric.time)).toBe(TIME);

      expect(parsed.metric.event.category).toBe(category);
      expect(parsed.metric.event.action).toBe(action);
      expect(unpackValue(parsed.metric.event.label)).toEqual(label);
      expect(unpackValue(parsed.metric.event.value)).toEqual(value);
    },
  );

  test.each([
    ['category', 'variable', 1, 'label'],
    ['category', 'variable', 0, 'label'],
    ['category', 'variable', 1, null],
  ])(
    'should correctly parse "timing" metrics category=%p variable=%p time=%p label=%p',
    (category, variable, time, label) => {
      const metric = metricMessageFromJson(CID, IP, [
        'timing',
        TIME,
        category,
        variable,
        time,
        label,
      ]);
      expect(MetricMessage.verify(metric)).toBeNull();

      const bytes = MetricMessage.encode(metric).finish();
      const parsed = MetricMessage.decode(bytes);

      expect(parsed.ip).toBe(IP);
      expect(parsed.cid).toBe(CID);
      expect(msFromTimestamp(parsed.metric.time)).toBe(TIME);

      expect(parsed.metric.timing.category).toBe(category);
      expect(parsed.metric.timing.variable).toBe(variable);
      expect(parsed.metric.timing.time.toString()).toBe(time.toString());
      expect(unpackValue(parsed.metric.timing.label)).toEqual(label);
    },
  );

  test.each([['network', 'action', 'target']])(
    'should correctly parse "social" metrics network=%p action=%p target=%p',
    (network, action, target) => {
      const metric = metricMessageFromJson(CID, IP, [
        'social',
        TIME,
        network,
        action,
        target,
      ]);
      expect(MetricMessage.verify(metric)).toBeNull();

      const bytes = MetricMessage.encode(metric).finish();
      const parsed = MetricMessage.decode(bytes);

      expect(parsed.ip).toBe(IP);
      expect(parsed.cid).toBe(CID);
      expect(msFromTimestamp(parsed.metric.time)).toBe(TIME);

      expect(parsed.metric.social.network).toBe(network);
      expect(parsed.metric.social.action).toBe(action);
      expect(parsed.metric.social.target).toBe(target);
    },
  );

  test.each([['message', true]])(
    'should correctly parse "error" metrics message=%p fatal=%p',
    (message, fatal) => {
      const metric = metricMessageFromJson(CID, IP, [
        'error',
        TIME,
        message,
        fatal,
      ]);
      expect(MetricMessage.verify(metric)).toBeNull();

      const bytes = MetricMessage.encode(metric).finish();
      const parsed = MetricMessage.decode(bytes);

      expect(parsed.ip).toBe(IP);
      expect(parsed.cid).toBe(CID);
      expect(msFromTimestamp(parsed.metric.time)).toBe(TIME);

      expect(parsed.metric.error.message).toBe(message);
      expect(parsed.metric.error.fatal).toBe(fatal);
    },
  );

  test('should error if type unexpected', () => {
    expect(() => metricMessageFromJson(CID, IP, ['foo'])).toThrow();
  });
});
