// @flow strict

const parseEnv = require('env-schema');

type Config = {
  MODE: 'all' | 'grpc-server' | 'rest-server',
  REST_HOST: string,
  REST_PORT: number,
  GRPC_HOST: string,
  GRPC_PORT: number,
  LOG_LEVEL: string,
  TRUST_PROXY: boolean,
  KAFKA_TOPIC_PREFIX: string,
  KAFKA_CLIENT_ID: string,
  KAFKA_BROKER_LIST: string,
  SERIALIZATION_MODE: 'json',
};

const config: Config = parseEnv({
  dotenv: true,
  schema: {
    type: 'object',
    required: [
      'MODE',
      'REST_HOST',
      'REST_PORT',
      'GRPC_HOST',
      'GRPC_PORT',
      'LOG_LEVEL',
      'TRUST_PROXY',
      'KAFKA_TOPIC_PREFIX',
      'KAFKA_CLIENT_ID',
      'KAFKA_BROKER_LIST',
      'SERIALIZATION_MODE',
    ],
    properties: {
      MODE: {
        type: 'string',
        default: 'all',
        enum: ['all', 'grpc-server', 'rest-server'],
      },
      REST_HOST: {
        type: 'string',
        default: '0.0.0.0',
      },
      REST_PORT: {
        type: 'number',
        default: 3000,
      },
      GRPC_HOST: {
        type: 'string',
        default: '0.0.0.0',
      },
      GRPC_PORT: {
        type: 'number',
        default: 3001,
      },
      LOG_LEVEL: {
        type: 'string',
        default: 'debug',
      },
      TRUST_PROXY: {
        type: 'boolean',
        default: true,
      },
      KAFKA_TOPIC_PREFIX: {
        type: 'string',
        default: 'metrics-',
      },
      KAFKA_CLIENT_ID: {
        type: 'string',
        default: 'clickroad',
      },
      KAFKA_BROKER_LIST: {
        type: 'string',
        default: 'localhost:9092',
      },
      SERIALIZATION_MODE: {
        type: 'string',
        default: 'proto',
        enum: ['json'],
      },
    },
  },
});

module.exports = config;
