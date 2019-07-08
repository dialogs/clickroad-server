// @flow strict

const createRestServer = require('./server/rest-server');
const createGrpcServer = require('./server/grpc-server');
const createKafkaProducer = require('./producer/kafka-producer');
const createKafkaConsumer = require('./consumer/kafka-consumer');
const createPgPersister = require('./persister/pg-persister');

module.exports = {
  createRestServer,
  createGrpcServer,
  createKafkaProducer,
  createKafkaConsumer,
  createPgPersister,
};
