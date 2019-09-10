// @flow strict

const createRestServer = require('./server/rest-server');
const createGrpcServer = require('./server/grpc-server');
const createKafkaProducer = require('./producer/kafka-producer');
const createJsonSerializer = require('./serializer/json-serializer');

module.exports = {
  createRestServer,
  createGrpcServer,
  createKafkaProducer,
  createJsonSerializer,
};
