// @flow strict

const parseEnv = require('env-schema');

type Config = {
  MODE: 'all' | 'worker' | 'grpc-server' | 'rest-server',
  REST_HOST: string,
  REST_PORT: number,
  GRPC_HOST: string,
  GRPC_PORT: number,
  LOG_LEVEL: string,
  TRUST_PROXY: boolean,
  KAFKA_TOPIC: string,
  KAFKA_GROUP_ID: string,
  KAFKA_CLIENT_ID: string,
  KAFKA_BROKER_LIST: string,
  KAFKA_PERSIST_TOPIC: string,
  PG_CONNECTION_STRING: string,
  PERSIST_MODE: 'postgres' | 'kafka',
  SERIALIZATION_MODE: 'proto' | 'json',
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
      'KAFKA_TOPIC',
      'KAFKA_GROUP_ID',
      'KAFKA_CLIENT_ID',
      'KAFKA_BROKER_LIST',
      'KAFKA_PERSIST_TOPIC',
      'PG_CONNECTION_STRING',
      'PERSIST_MODE',
      'SERIALIZATION_MODE',
    ],
    properties: {
      MODE: {
        type: 'string',
        default: 'all',
        enum: ['all', 'worker', 'grpc-server', 'rest-server'],
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
      KAFKA_TOPIC: {
        type: 'string',
        default: 'metrics',
      },
      KAFKA_GROUP_ID: {
        type: 'string',
        default: 'clickroad',
      },
      KAFKA_CLIENT_ID: {
        type: 'string',
        default: 'clickroad',
      },
      KAFKA_BROKER_LIST: {
        type: 'string',
        default: 'localhost:9092',
      },
      KAFKA_PERSIST_TOPIC: {
        type: 'string',
        default: 'metrics_out',
      },
      PG_CONNECTION_STRING: {
        type: 'string',
        default: 'postgres://localhost/clickroad',
      },
      PERSIST_MODE: {
        type: 'string',
        default: 'postgres',
        enum: ['postgres', 'kafka'],
      },
      SERIALIZATION_MODE: {
        type: 'string',
        default: 'proto',
        enum: ['proto', 'json'],
      },
    },
  },
});

module.exports = config;
