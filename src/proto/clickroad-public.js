// @flow strict

const path = require('path');
const { loadPackageDefinition } = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(
  path.resolve(__dirname, '../../proto/clickroad-public.proto'),
  {
    arrays: true,
    oneofs: true,
    objects: false,
    keepCase: false,
    defaults: true,
  },
);

const { clickroad } = loadPackageDefinition(packageDefinition);

module.exports = clickroad;
