// @flow strict

import type { MetricMessage } from './proto/clickroad-private';

export interface Persister {
  stop(): Promise<void>;
  persist(message: MetricMessage): Promise<void>;
}

export interface Consumer {
  stop(): Promise<void>;
}

export interface Producer {
  stop(): Promise<void>;
  produce(messages: Array<MetricMessage>): Promise<void>;
}
