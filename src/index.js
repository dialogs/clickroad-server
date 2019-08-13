// @flow strict

const createRestServer = require('./server/rest-server');
const createGrpcServer = require('./server/grpc-server');
const createKafkaProducer = require('./producer/kafka-producer');
const createKafkaConsumer = require('./consumer/kafka-consumer');
const createPgPersister = require('./persister/pg-persister');
const createJsonSerializer = require('./serializer/json-serializer');
const createProtoSerializer = require('./serializer/proto-serializer');
const createProtoDeserializer = require('./deserializer/proto-deserializer');

module.exports = {
  createRestServer,
  createGrpcServer,
  createKafkaProducer,
  createKafkaConsumer,
  createPgPersister,
  createJsonSerializer,
  createProtoSerializer,
  createProtoDeserializer,
};
