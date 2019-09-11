const _ = require('lodash');
const { credentials } = require('grpc');
const pino = require('pino');
const { Kafka } = require('kafkajs');
const {
  createGrpcServer,
  createKafkaProducer,
  createJsonSerializer,
} = require('../index');
const { ClickRoad } = require('../proto/clickroad-public');
const {
  packValue,
  timestampFromMs,
  msFromTimestamp,
} = require('../proto/utils');

const KAFKA_BROKERS = ['localhost:9092'];
const KAFKA_CLIENT_ID = 'e2e-clickroad-test-client';
const KAFKA_TOPIC_PREFIX = 'e2e-clickroad-test-';
const KAFKA_TOPICS = [
  `${KAFKA_TOPIC_PREFIX}context`,
  `${KAFKA_TOPIC_PREFIX}screen-view`,
  `${KAFKA_TOPIC_PREFIX}event`,
  `${KAFKA_TOPIC_PREFIX}timing`,
  `${KAFKA_TOPIC_PREFIX}social`,
  `${KAFKA_TOPIC_PREFIX}error`,
  `${KAFKA_TOPIC_PREFIX}unknown`,
];

let server;

async function kafkaAdmin(callback) {
  const kafka = new Kafka({
    brokers: KAFKA_BROKERS,
    clientId: KAFKA_CLIENT_ID,
  });

  const admin = kafka.admin();

  await admin.connect();
  await callback(admin);
  await admin.disconnect();
}

async function kafkaCat({ brokers, clientId, groupId, limit, deserialize }) {
  const kafka = new Kafka({ brokers, clientId });

  const consumer = kafka.consumer({ groupId });

  await consumer.connect();
  for (const topic of KAFKA_TOPICS) {
    await consumer.subscribe({ topic, fromBeginning: true });
  }

  const messages = [];
  await consumer.run({
    async eachMessage({ topic, message }) {
      messages.push({ topic, message: deserialize(message.value) });
    },
  });

  while (true) {
    if (messages.length >= limit) {
      await consumer.disconnect();
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 42));
  }

  return messages.slice(0, limit);
}

beforeEach(async () => {
  const logger = pino({
    prettyPrint: true,
  });

  await kafkaAdmin(async (admin) => {
    await admin.createTopics({
      waitForLeaders: true,
      topics: KAFKA_TOPICS.map((topic) => ({ topic })),
    });
  });

  server = createGrpcServer({
    logger,
    producer: createKafkaProducer({
      logger: console,
      serializer: createJsonSerializer(),
      brokers: KAFKA_BROKERS,
      clientId: KAFKA_CLIENT_ID,
      topicPrefix: KAFKA_TOPIC_PREFIX,
    }),
  });

  await server.listen({ host: 'localhost', port: 3000 });
});

afterEach(async () => {
  if (server) {
    await server.stop();
  }

  await kafkaAdmin(async (admin) => {
    await admin.deleteTopics({
      topics: KAFKA_TOPICS,
    });
  });
});

test('e2e: gRPC Server correctly produce messages', async () => {
  const client = new ClickRoad('localhost:3000', credentials.createInsecure());
  const trackEvent = (request, options) =>
    new Promise((resolve, reject) => {
      client.trackEvent(request, options, (error, response) =>
        error ? reject(error) : resolve(response),
      );
    });

  const time = timestampFromMs(Date.now());
  const response = await trackEvent(
    {
      cid: '',
      metrics: [
        {
          time,
          context: { context: { foo: 'bar' } },
        },
        {
          time,
          screenView: {
            name: 'test',
            source: packValue('test'),
            url: packValue('test'),
          },
        },
      ],
    },
    { deadline: Date.now() + 1000 },
  );

  const messages = await kafkaCat({
    limit: 2,
    brokers: KAFKA_BROKERS,
    clientId: KAFKA_CLIENT_ID,
    groupId: 'e2e-clickroad-test-consumer',
    deserialize: (buffer) => JSON.parse(buffer),
  });

  expect(messages).toHaveLength(2);

  const [context, screenView] = messages;

  expect(context.topic).toBe(`${KAFKA_TOPIC_PREFIX}context`);
  expect(context.message.cid).toBe(response.cid);
  expect(context.message.clientTime).toBe(msFromTimestamp(time));
  expect(context.message.metric).toEqual({ foo: 'bar' });

  expect(screenView.topic).toBe(`${KAFKA_TOPIC_PREFIX}screen-view`);
  expect(screenView.message.cid).toBe(response.cid);
  expect(screenView.message.clientTime).toBe(msFromTimestamp(time));
  expect(screenView.message.metric).toEqual({
    name: 'test',
    source: 'test',
    url: 'test',
  });
});
