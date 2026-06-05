/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { concurrentlyExec } from '@kbn/securitysolution-utils/src/client_concurrency';
import type { Client as DetectionsClient } from '../../../../common/api/quickstart_client.gen';
import type { QueryRuleCreateProps } from '../../../../common/api/detection_engine';

const GOOFY_NAMES = [
  'Lucky Detector',
  'Suspicious Birthday Cake',
  'Rogue Party Hat Activity',
  'Anomalous Confetti Burst',
  'Unauthorized Karaoke',
  'Excessive Cake Consumption',
  'Sneaky Streamer Detected',
  'Festive Behavior Anomaly',
  'Glitter Cannon Discharge',
  'Streamers Crossing the Streams',
];

/**
 * Seed N detection rules with goofy names. Rules are created NOW (so today is
 * their birthday) and are immediately picked up by the `birthdays_today`
 * endpoint. The `targetDate` parameter is informational — the rules' actual
 * `created_at` is set by the Alerting Framework at creation time and matches
 * "today" on the host where this script runs.
 *
 * Used to populate the demo Kibana instance with rules celebrating today.
 */
export const createBirthdayRules = async ({
  detectionsClient,
  targetDate,
  count,
}: {
  detectionsClient: DetectionsClient;
  targetDate: string;
  count: number;
}) => {
  const safeCount = Math.min(Math.max(count, 1), GOOFY_NAMES.length);
  const rulesToCreate: QueryRuleCreateProps[] = Array.from({ length: safeCount }, (_, i) => ({
    type: 'query',
    name: `${GOOFY_NAMES[i]}`,
    description: `Demo birthday rule #${i + 1} — created for the AI workshop.`,
    risk_score: 21,
    severity: 'low',
    query: '*',
    index: ['logs-*'],
    enabled: false,
    tags: ['demo', 'ai-workshop'],
  }));

  const functions = rulesToCreate.map((rule) => () => detectionsClient.createRule({ body: rule }));
  return concurrentlyExec(functions);
};
