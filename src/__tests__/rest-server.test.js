jest.mock('../proto/clickroad-private', () => {
  return {
    metricMessageFromJson: jest.fn((...args) => args),
  };
});

const { createRestServer } = require('../index');
const { metricMessageFromJson } = require('../proto/clickroad-private');

function createMockProducer(produceResult) {
  return {
    stop: jest.fn().mockResolvedValue(),
    produce: jest.fn(produceResult),
  };
}

describe('rest-server', () => {
  it('should correctly bypass request to producer', async () => {
    const producer = createMockProducer(() => Promise.resolve());
    const server = createRestServer({
      producer,
      trustProxy: true,
    });

    const ip = '1.1.1.1';
    const metric = ['context', Date.now(), { appName: 'test' }];

    const res = await server.inject({
      method: 'POST',
      url: '/rest/metrics',
      payload: JSON.stringify([metric]),
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.cid).toBeDefined();

    expect(metricMessageFromJson).toHaveBeenCalledWith(body.cid, ip, metric);
    expect(producer.produce).toHaveBeenCalledWith([[body.cid, ip, metric]]);
  });

  it('should correctly handle internal errors', async () => {
    const producer = createMockProducer(() =>
      Promise.reject(new Error('test error')),
    );
    const server = createRestServer({
      producer,
      trustProxy: true,
    });

    const res = await server.inject({
      method: 'POST',
      url: '/rest/metrics',
      payload: JSON.stringify([]),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(res.statusCode).toBe(500);

    const body = JSON.parse(res.payload);
    expect(body.ok).toBe(false);
  });
});
