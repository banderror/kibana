/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  APM_APP_ID,
  LOGS_APP_ID,
  METRICS_APP_ID,
  OBSERVABILITY_LOGS_EXPLORER_APP_ID,
  LAST_USED_LOGS_VIEWER_APP_ID,
  OBSERVABILITY_ONBOARDING_APP_ID,
  OBSERVABILITY_OVERVIEW_APP_ID,
  SYNTHETICS_APP_ID,
  UPTIME_APP_ID,
  SLO_APP_ID,
  AI_ASSISTANT_APP_ID,
  OBLT_UX_APP_ID,
  OBLT_PROFILING_APP_ID,
  INVENTORY_APP_ID,
  STREAMS_APP_ID,
} from './constants';

type LogsApp = typeof LOGS_APP_ID;
type ObservabilityLogsExplorerApp = typeof OBSERVABILITY_LOGS_EXPLORER_APP_ID;
type LastUsedLogsViewerApp = typeof LAST_USED_LOGS_VIEWER_APP_ID;
type ObservabilityOverviewApp = typeof OBSERVABILITY_OVERVIEW_APP_ID;
type MetricsApp = typeof METRICS_APP_ID;
type ApmApp = typeof APM_APP_ID;
type SyntheticsApp = typeof SYNTHETICS_APP_ID;
type UptimeApp = typeof UPTIME_APP_ID;
type ObservabilityOnboardingApp = typeof OBSERVABILITY_ONBOARDING_APP_ID;
type SloApp = typeof SLO_APP_ID;
type AiAssistantApp = typeof AI_ASSISTANT_APP_ID;
type ObltUxApp = typeof OBLT_UX_APP_ID;
type ObltProfilingApp = typeof OBLT_PROFILING_APP_ID;
type InventoryApp = typeof INVENTORY_APP_ID;
type StreamsApp = typeof STREAMS_APP_ID;

export type AppId =
  | LogsApp
  | ObservabilityLogsExplorerApp
  | LastUsedLogsViewerApp
  | ObservabilityOverviewApp
  | ObservabilityOnboardingApp
  | ApmApp
  | MetricsApp
  | SyntheticsApp
  | UptimeApp
  | SloApp
  | AiAssistantApp
  | ObltUxApp
  | ObltProfilingApp
  | InventoryApp
  | StreamsApp;

export type LogsLinkId = 'log-categories' | 'settings' | 'anomalies' | 'stream';

export type InventoryLinkId = 'datastreams';

export type ObservabilityOverviewLinkId =
  | 'alerts'
  | 'cases'
  | 'cases_configure'
  | 'cases_create'
  | 'rules';

export type MetricsLinkId =
  | 'inventory'
  | 'metrics-explorer'
  | 'hosts'
  | 'settings'
  | 'assetDetails';

export type ApmLinkId =
  | 'services'
  | 'traces'
  | 'service-groups-list'
  | 'service-map'
  | 'dependencies'
  | 'settings'
  | 'storage-explorer';

export type SyntheticsLinkId = 'certificates' | 'overview';

export type UptimeLinkId = 'Certificates';

export type ProfilingLinkId = 'stacktraces' | 'flamegraphs' | 'functions';

export type StreamsLinkId = 'overview';

export type LinkId =
  | LogsLinkId
  | ObservabilityOverviewLinkId
  | MetricsLinkId
  | ApmLinkId
  | SyntheticsLinkId
  | UptimeLinkId
  | ProfilingLinkId
  | StreamsLinkId;

export type DeepLinkId =
  | AppId
  | `${LogsApp}:${LogsLinkId}`
  | `${ObservabilityOverviewApp}:${ObservabilityOverviewLinkId}`
  | `${MetricsApp}:${MetricsLinkId}`
  | `${ApmApp}:${ApmLinkId}`
  | `${SyntheticsApp}:${SyntheticsLinkId}`
  | `${UptimeApp}:${UptimeLinkId}`
  | `${ObltProfilingApp}:${ProfilingLinkId}`
  | `${InventoryApp}:${InventoryLinkId}`
  | `${StreamsApp}:${StreamsLinkId}`;
