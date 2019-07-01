// @flow strict

const createRestServer = require('./rest-server');
const createGrpcServer = require('./grpc-server');

module.exports = {
  createRestServer,
  createGrpcServer,
};
