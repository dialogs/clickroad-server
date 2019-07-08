# ClickRoad Server

Lightweight application metrics collector.

[![CircleCI](https://img.shields.io/circleci/build/github/dialogs/clickroad-server/master.svg)](https://circleci.com/gh/dialogs/clickroad-server)
[![codecov](https://codecov.io/gh/dialogs/clickroad-server/branch/master/graph/badge.svg)](https://codecov.io/gh/dialogs/clickroad-server)
[![Docker Repository on Quay](https://quay.io/repository/dlgim/clickroad-server/status)](https://quay.io/repository/dlgim/clickroad-server)

## Installation

```
docker pull quay.io/dlgim/clickroad-server
```

[Docker compose example](example/docker-compose.yml)

## Configuration

Image fully configurable using environment variables.

| Name                 | Default                        | Description                                                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REST_HOST            | 0.0.0.0                        | REST (web) server listen port.                                                                                                                                                                                                                                              |
| REST_PORT            | 3000                           | REST (web) server listen host.                                                                                                                                                                                                                                              |
| GRPC_HOST            | 0.0.0.0                        | gRPC server listen host.                                                                                                                                                                                                                                                    |
| GRPC_PORT            | 3001                           | gRPC server listen port.                                                                                                                                                                                                                                                    |
| MODE                 | both                           | `rest-server` - starts the metrics producer REST server. `grpc-server` - starts the metrics producer gRPC server. `worker` - starts the metrics consumer and persists them to Postgres. `all` - starts all services in the single process, _not recommended in production_. |
| KAFKA_TOPIC          | metrics                        | Kafka topic name.                                                                                                                                                                                                                                                           |
| KAFKA_GROUP_ID       | clickroad                      | Kafka consumer group id.                                                                                                                                                                                                                                                    |
| KAFKA_CLIENT_ID      | clickroad                      | Kafka client id.                                                                                                                                                                                                                                                            |
| KAFKA_BROKER_LIST    | localhost:9092                 | Kafka comma delimited broker list.                                                                                                                                                                                                                                          |
| PG_CONNECTION_STRING | postgres://localhost/clickroad | PostgreSQL connection string. https://github.com/iceddev/pg-connection-string                                                                                                                                                                                               |

### High Level Architecture

![High Level Architecture](docs/HLA.svg)

## Development

If you're using macOS paste this before installation:

```bash
export CPPFLAGS=-I/usr/local/opt/openssl/include
export LDFLAGS=-L/usr/local/opt/openssl/lib
```

## License

[Apache-2.0](LICENSE)
