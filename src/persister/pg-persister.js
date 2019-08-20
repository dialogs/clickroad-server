// @flow strict

import type { Persister } from '../types';
import type { MetricMessage } from '../proto/clickroad-private';
const createKnex = require('knex');
const { timestamp, unpackValue, msFromTimestamp } = require('../proto/utils');

type Config = {
  connection: string,
};

async function createPgPersister({ connection }: Config): Promise<Persister> {
  const pg = createKnex({
    connection,
    client: 'pg',
  });

  await pg.migrate.latest({
    migrationSource: {
      getMigrations: async () => ['init'],
      getMigrationName: (name) => name,
      getMigration(name) {
        return {
          async up(knex) {
            switch (name) {
              case 'init':
                await knex.schema.createTable('metrics_context', (t) => {
                  t.uuid('cid').index();
                  t.specificType('ip', 'inet');
                  t.dateTime('client_time', { useTz: true });
                  t.dateTime('server_time', { useTz: true });
                  t.jsonb('payload');
                });
                await knex.schema.createTable('metrics_screen_view', (t) => {
                  t.uuid('cid').index();
                  t.specificType('ip', 'inet');
                  t.dateTime('client_time', { useTz: true });
                  t.dateTime('server_time', { useTz: true });
                  t.string('name');
                  t.string('url').nullable();
                  t.string('source').nullable();
                });
                await knex.schema.createTable('metrics_event', (t) => {
                  t.uuid('cid').index();
                  t.specificType('ip', 'inet');
                  t.dateTime('client_time', { useTz: true });
                  t.dateTime('server_time', { useTz: true });
                  t.string('category');
                  t.string('action');
                  t.string('label').nullable();
                  t.decimal('value').nullable();
                });
                await knex.schema.createTable('metrics_timing', (t) => {
                  t.uuid('cid').index();
                  t.specificType('ip', 'inet');
                  t.dateTime('client_time', { useTz: true });
                  t.dateTime('server_time', { useTz: true });
                  t.string('category');
                  t.string('variable');
                  t.bigint('time');
                  t.string('label').nullable();
                });
                await knex.schema.createTable('metrics_social', (t) => {
                  t.uuid('cid').index();
                  t.specificType('ip', 'inet');
                  t.dateTime('client_time', { useTz: true });
                  t.dateTime('server_time', { useTz: true });
                  t.string('network');
                  t.string('action');
                  t.string('target');
                });
                await knex.schema.createTable('metrics_error', (t) => {
                  t.uuid('cid').index();
                  t.specificType('ip', 'inet');
                  t.dateTime('client_time', { useTz: true });
                  t.dateTime('server_time', { useTz: true });
                  t.string('message');
                  t.boolean('fatal');
                });
                await knex.schema.createTable('metrics_unmapped', (t) => {
                  t.uuid('cid').index();
                  t.specificType('ip', 'inet');
                  t.dateTime('client_time', { useTz: true });
                  t.dateTime('server_time', { useTz: true });
                  t.jsonb('payload');
                });
                break;
            }
          },
          async down() {},
        };
      },
    },
  });

  return {
    async persist(metricMessage: MetricMessage) {
      const server_time = timestamp(Date.now());
      const { cid, ip, metric } = metricMessage;
      const client_time = timestamp(msFromTimestamp(metric.time));

      if (metric.context) {
        const { context: payload } = metric.context;
        await pg('metrics_context').insert({
          cid,
          ip,
          client_time,
          server_time,
          payload,
        });
      } else if (metric.screenView) {
        const { name, source, url } = metric.screenView;
        await pg('metrics_screen_view').insert({
          cid,
          ip,
          client_time,
          server_time,
          name,
          source: unpackValue(source),
          url: unpackValue(url),
        });
      } else if (metric.event) {
        const { category, action, label, value } = metric.event;
        await pg('metrics_event').insert({
          cid,
          ip,
          client_time,
          server_time,
          category,
          action,
          label: unpackValue(label),
          value: unpackValue(value),
        });
      } else if (metric.timing) {
        const { category, variable, time, label } = metric.timing;
        await pg('metrics_timing').insert({
          cid,
          ip,
          client_time,
          server_time,
          category,
          variable,
          time: time.toString(),
          label: unpackValue(label),
        });
      } else if (metric.social) {
        const { network, action, target } = metric.social;
        await pg('metrics_social').insert({
          cid,
          ip,
          client_time,
          server_time,
          network,
          action,
          target,
        });
      } else if (metric.error) {
        const { message, fatal } = metric.error;
        await pg('metrics_error').insert({
          cid,
          ip,
          client_time,
          server_time,
          message,
          fatal,
        });
      }
    },
    async stop() {
      await pg.destroy();
    },
  };
}

module.exports = createPgPersister;
