// @flow strict

import type { MetricMessage } from './proto/clickroad-private';

export interface Producer {
  stop(): Promise<void>;
  produce(messages: Array<MetricMessage>): Promise<void>;
}

export type SerializedMessage = {
  type: string,
  payload: Buffer,
};

export interface Serializer {
  serialize(message: MetricMessage): SerializedMessage;
}
