/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';

import {
  concurrent_searches,
  items_per_search,
  machine_learning_job_id,
  RiskScore,
  RiskScoreMapping,
  RuleActionArray,
  RuleActionThrottle,
  RuleInterval,
  RuleIntervalFrom,
  RuleIntervalTo,
  Severity,
  SeverityMapping,
  threat_filters,
  threat_index,
  threat_indicator_path,
  threat_mapping,
  threat_query,
} from '@kbn/securitysolution-io-ts-alerting-types';

import { RuleExecutionSummary } from '../../rule_monitoring';
import { ResponseActionArray } from '../../rule_response_actions/schemas';
import {
  AlertsIndex,
  AlertsIndexNamespace,
  BuildingBlockType,
  DataViewId,
  EventCategoryOverride,
  ExceptionListArray,
  IndexPatternArray,
  InvestigationGuide,
  IsRuleEnabled,
  IsRuleImmutable,
  MaxSignals,
  RelatedIntegrationArray,
  RequiredFieldArray,
  RuleAuthorArray,
  RuleDescription,
  RuleFalsePositiveArray,
  RuleFilterArray,
  RuleLicense,
  RuleMetadata,
  RuleName,
  RuleNameOverride,
  RuleObjectId,
  RuleQuery,
  RuleReferenceArray,
  RuleSignatureId,
  RuleTagArray,
  RuleVersion,
  SavedObjectResolveAliasPurpose,
  SavedObjectResolveAliasTargetId,
  SavedObjectResolveOutcome,
  SetupGuide,
  ThreatArray,
  TiebreakerField,
  TimelineTemplateId,
  TimelineTemplateTitle,
  TimestampField,
  TimestampOverride,
  TimestampOverrideFallbackDisabled,
} from '..';
import {
  saved_id,
  threshold,
  anomaly_threshold,
  updated_at,
  updated_by,
  created_at,
  created_by,
  newTermsFields,
  historyWindowStart,
} from '../../schemas/common';

import { buildRuleSchemas } from './build_rule_schemas';

// -------------------------------------------------------------------------------------------------
// Base schema

const baseSchema = buildRuleSchemas({
  required: {
    name: RuleName,
    description: RuleDescription,
    severity: Severity,
    risk_score: RiskScore,
  },
  optional: {
    // Field overrides
    rule_name_override: RuleNameOverride,
    timestamp_override: TimestampOverride,
    timestamp_override_fallback_disabled: TimestampOverrideFallbackDisabled,
    // Timeline template
    timeline_id: TimelineTemplateId,
    timeline_title: TimelineTemplateTitle,
    // Atributes related to SavedObjectsClient.resolve API
    outcome: SavedObjectResolveOutcome,
    alias_target_id: SavedObjectResolveAliasTargetId,
    alias_purpose: SavedObjectResolveAliasPurpose,
    // Misc attributes
    license: RuleLicense,
    note: InvestigationGuide,
    building_block_type: BuildingBlockType,
    output_index: AlertsIndex,
    namespace: AlertsIndexNamespace,
    meta: RuleMetadata,
  },
  defaultable: {
    // Main attributes
    version: RuleVersion,
    tags: RuleTagArray,
    enabled: IsRuleEnabled,
    // Field overrides
    risk_score_mapping: RiskScoreMapping,
    severity_mapping: SeverityMapping,
    // Rule schedule
    interval: RuleInterval,
    from: RuleIntervalFrom,
    to: RuleIntervalTo,
    // Rule actions
    actions: RuleActionArray,
    throttle: RuleActionThrottle,
    // Rule exceptions
    exceptions_list: ExceptionListArray,
    // Misc attributes
    author: RuleAuthorArray,
    false_positives: RuleFalsePositiveArray,
    references: RuleReferenceArray,
    // maxSignals not used in ML rules but probably should be used
    max_signals: MaxSignals,
    threat: ThreatArray,
  },
});

const responseRequiredFields = {
  id: RuleObjectId,
  rule_id: RuleSignatureId,
  immutable: IsRuleImmutable,
  updated_at,
  updated_by,
  created_at,
  created_by,

  // NOTE: For now, Related Integrations, Required Fields and Setup Guide are supported for prebuilt
  // rules only. We don't want to allow users to edit these 3 fields via the API. If we added them
  // to baseParams.defaultable, they would become a part of the request schema as optional fields.
  // This is why we add them here, in order to add them only to the response schema.
  related_integrations: RelatedIntegrationArray,
  required_fields: RequiredFieldArray,
  setup: SetupGuide,
};

const responseOptionalFields = {
  execution_summary: RuleExecutionSummary,
};

export type BaseCreateProps = t.TypeOf<typeof BaseCreateProps>;
export const BaseCreateProps = baseSchema.create;

// -------------------------------------------------------------------------------------------------
// Shared schemas

// "Shared" types are the same across all rule types, and built from "baseSchema" above
// with some variations for each route. These intersect with type specific schemas below
// to create the full schema for each route.

type SharedCreateProps = t.TypeOf<typeof SharedCreateProps>;
const SharedCreateProps = t.intersection([
  baseSchema.create,
  t.exact(t.partial({ rule_id: RuleSignatureId })),
]);

type SharedUpdateProps = t.TypeOf<typeof SharedUpdateProps>;
const SharedUpdateProps = t.intersection([
  baseSchema.create,
  t.exact(t.partial({ rule_id: RuleSignatureId })),
  t.exact(t.partial({ id: RuleObjectId })),
]);

type SharedPatchProps = t.TypeOf<typeof SharedPatchProps>;
const SharedPatchProps = t.intersection([
  baseSchema.patch,
  t.exact(t.partial({ rule_id: RuleSignatureId, id: RuleObjectId })),
]);

export type SharedResponseProps = t.TypeOf<typeof SharedResponseProps>;
export const SharedResponseProps = t.intersection([
  baseSchema.response,
  t.exact(t.type(responseRequiredFields)),
  t.exact(t.partial(responseOptionalFields)),
]);

type CreateSchema<T> = SharedCreateProps & T;
type UpdateSchema<T> = SharedUpdateProps & T;
type PatchSchema<T> = SharedPatchProps & T;
type ResponseSchema<T> = SharedResponseProps & T;

// -------------------------------------------------------------------------------------------------
// EQL rule schema

const eqlSchema = buildRuleSchemas({
  required: {
    type: t.literal('eql'),
    language: t.literal('eql'),
    query: RuleQuery,
  },
  optional: {
    index: IndexPatternArray,
    data_view_id: DataViewId,
    filters: RuleFilterArray,
    event_category_override: EventCategoryOverride,
    timestamp_field: TimestampField,
    tiebreaker_field: TiebreakerField,
  },
  defaultable: {},
});

export type EqlRule = t.TypeOf<typeof EqlRule>;
export const EqlRule = t.intersection([SharedResponseProps, eqlSchema.response]);

export type EqlRuleCreateProps = t.TypeOf<typeof EqlRuleCreateProps>;
export const EqlRuleCreateProps = t.intersection([SharedCreateProps, eqlSchema.create]);

export type EqlRuleUpdateProps = t.TypeOf<typeof EqlRuleUpdateProps>;
export const EqlRuleUpdateProps = t.intersection([SharedUpdateProps, eqlSchema.create]);

export type EqlRulePatchProps = t.TypeOf<typeof EqlRulePatchProps>;
export const EqlRulePatchProps = t.intersection([SharedPatchProps, eqlSchema.patch]);

export type EqlPatchParams = t.TypeOf<typeof EqlPatchParams>;
export const EqlPatchParams = eqlSchema.patch;

// -------------------------------------------------------------------------------------------------
// Indicator Match rule schema

const threatMatchSchema = buildRuleSchemas({
  required: {
    type: t.literal('threat_match'),
    query: RuleQuery,
    threat_query,
    threat_mapping,
    threat_index,
  },
  optional: {
    index: IndexPatternArray,
    data_view_id: DataViewId,
    filters: RuleFilterArray,
    saved_id,
    threat_filters,
    threat_indicator_path,
    threat_language: t.keyof({ kuery: null, lucene: null }),
    concurrent_searches,
    items_per_search,
  },
  defaultable: {
    language: t.keyof({ kuery: null, lucene: null }),
  },
});

export type ThreatMatchRule = t.TypeOf<typeof ThreatMatchRule>;
export const ThreatMatchRule = t.intersection([SharedResponseProps, threatMatchSchema.response]);

export type ThreatMatchRuleCreateProps = t.TypeOf<typeof ThreatMatchRuleCreateProps>;
export const ThreatMatchRuleCreateProps = t.intersection([
  SharedCreateProps,
  threatMatchSchema.create,
]);

export type ThreatMatchRuleUpdateProps = t.TypeOf<typeof ThreatMatchRuleUpdateProps>;
export const ThreatMatchRuleUpdateProps = t.intersection([
  SharedUpdateProps,
  threatMatchSchema.create,
]);

export type ThreatMatchRulePatchProps = t.TypeOf<typeof ThreatMatchRulePatchProps>;
export const ThreatMatchRulePatchProps = t.intersection([
  SharedPatchProps,
  threatMatchSchema.patch,
]);

export type ThreatMatchPatchParams = t.TypeOf<typeof ThreatMatchPatchParams>;
export const ThreatMatchPatchParams = threatMatchSchema.patch;

// -------------------------------------------------------------------------------------------------
// Custom Query rule schema

const querySchema = buildRuleSchemas({
  required: {
    type: t.literal('query'),
  },
  optional: {
    index: IndexPatternArray,
    data_view_id: DataViewId,
    filters: RuleFilterArray,
    saved_id,
    response_actions: ResponseActionArray,
  },
  defaultable: {
    query: RuleQuery,
    language: t.keyof({ kuery: null, lucene: null }),
  },
});

export type QueryCreateSchema = CreateSchema<t.TypeOf<typeof querySchema.create>>;
export type QueryUpdateSchema = UpdateSchema<t.TypeOf<typeof querySchema.create>>;
export type QueryPatchParams = t.TypeOf<typeof querySchema.patch>;
export type QueryResponseSchema = ResponseSchema<t.TypeOf<typeof querySchema.response>>;

export const queryPatchParams = querySchema.patch;

// -------------------------------------------------------------------------------------------------
// Saved Query rule schema

const savedQuerySchema = buildRuleSchemas({
  required: {
    type: t.literal('saved_query'),
    saved_id,
  },
  optional: {
    // Having language, query, and filters possibly defined adds more code confusion and probably user confusion
    // if the saved object gets deleted for some reason
    index: IndexPatternArray,
    data_view_id: DataViewId,
    query: RuleQuery,
    filters: RuleFilterArray,
    response_actions: ResponseActionArray,
  },
  defaultable: {
    language: t.keyof({ kuery: null, lucene: null }),
  },
});

export type SavedQueryCreateSchema = CreateSchema<t.TypeOf<typeof savedQuerySchema.create>>;
export type SavedQueryPatchParams = t.TypeOf<typeof savedQuerySchema.patch>;
export type SavedQueryResponseSchema = ResponseSchema<t.TypeOf<typeof savedQuerySchema.response>>;

export const savedQueryPatchParams = savedQuerySchema.patch;

// -------------------------------------------------------------------------------------------------
// Threshold rule schema

const thresholdRuleParams = {
  required: {
    type: t.literal('threshold'),
    query: RuleQuery,
    threshold,
  },
  optional: {
    index: IndexPatternArray,
    data_view_id: DataViewId,
    filters: RuleFilterArray,
    saved_id,
  },
  defaultable: {
    language: t.keyof({ kuery: null, lucene: null }),
  },
};

const {
  create: thresholdCreateParams,
  patch: thresholdPatchParams,
  response: thresholdResponseParams,
} = buildRuleSchemas(thresholdRuleParams);

export type ThresholdCreateSchema = CreateSchema<t.TypeOf<typeof thresholdCreateParams>>;
export type ThresholdPatchParams = t.TypeOf<typeof thresholdPatchParams>;
export type ThresholdResponseSchema = ResponseSchema<t.TypeOf<typeof thresholdResponseParams>>;

export type ThresholdRulePatchProps = t.TypeOf<typeof ThresholdRulePatchProps>;
export const ThresholdRulePatchProps = t.intersection([thresholdPatchParams, SharedPatchProps]);

export { thresholdCreateParams, thresholdPatchParams, thresholdResponseParams };

// -------------------------------------------------------------------------------------------------
// Machine Learning rule schema

const machineLearningRuleParams = {
  required: {
    type: t.literal('machine_learning'),
    anomaly_threshold,
    machine_learning_job_id,
  },
  optional: {},
  defaultable: {},
};

const {
  create: machineLearningCreateParams,
  patch: machineLearningPatchParams,
  response: machineLearningResponseParams,
} = buildRuleSchemas(machineLearningRuleParams);

export type MachineLearningCreateSchema = CreateSchema<
  t.TypeOf<typeof machineLearningCreateParams>
>;
export type MachineLearningUpdateSchema = UpdateSchema<
  t.TypeOf<typeof machineLearningCreateParams>
>;
export type MachineLearningPatchParams = t.TypeOf<typeof machineLearningPatchParams>;
export type MachineLearningResponseSchema = ResponseSchema<
  t.TypeOf<typeof machineLearningResponseParams>
>;

export { machineLearningCreateParams, machineLearningPatchParams, machineLearningResponseParams };

// -------------------------------------------------------------------------------------------------
// New Terms rule schema

const newTermsRuleParams = {
  required: {
    type: t.literal('new_terms'),
    query: RuleQuery,
    new_terms_fields: newTermsFields,
    history_window_start: historyWindowStart,
  },
  optional: {
    index: IndexPatternArray,
    data_view_id: DataViewId,
    filters: RuleFilterArray,
  },
  defaultable: {
    language: t.keyof({ kuery: null, lucene: null }),
  },
};

const {
  create: newTermsCreateParams,
  patch: newTermsPatchParams,
  response: newTermsResponseParams,
} = buildRuleSchemas(newTermsRuleParams);

export type NewTermsCreateSchema = CreateSchema<t.TypeOf<typeof newTermsCreateParams>>;
export type NewTermsUpdateSchema = UpdateSchema<t.TypeOf<typeof newTermsCreateParams>>;
export type NewTermsPatchParams = t.TypeOf<typeof newTermsPatchParams>;
export type NewTermsResponseSchema = ResponseSchema<t.TypeOf<typeof newTermsResponseParams>>;

export { newTermsCreateParams, newTermsPatchParams, newTermsResponseParams };

// -------------------------------------------------------------------------------------------------
// Combined type specific schemas

export type TypeSpecificCreateProps = t.TypeOf<typeof TypeSpecificCreateProps>;
export const TypeSpecificCreateProps = t.union([
  eqlSchema.create,
  threatMatchSchema.create,
  querySchema.create,
  savedQueryCreateParams,
  thresholdCreateParams,
  machineLearningCreateParams,
  newTermsCreateParams,
]);

export type TypeSpecificPatchProps = t.TypeOf<typeof TypeSpecificPatchProps>;
export const TypeSpecificPatchProps = t.union([
  eqlSchema.patch,
  threatMatchSchema.patch,
  querySchema.patch,
  savedQueryPatchParams,
  thresholdPatchParams,
  machineLearningPatchParams,
  newTermsPatchParams,
]);

export type TypeSpecificResponse = t.TypeOf<typeof TypeSpecificResponse>;
export const TypeSpecificResponse = t.union([
  eqlSchema.response,
  threatMatchSchema.response,
  querySchema.response,
  savedQueryResponseParams,
  thresholdResponseParams,
  machineLearningResponseParams,
  newTermsResponseParams,
]);

// -------------------------------------------------------------------------------------------------
// Final combined schemas

export type RuleCreateProps = t.TypeOf<typeof RuleCreateProps>;
export const RuleCreateProps = t.intersection([SharedCreateProps, TypeSpecificCreateProps]);

export type RuleUpdateProps = t.TypeOf<typeof RuleUpdateProps>;
export const RuleUpdateProps = t.intersection([TypeSpecificCreateProps, SharedUpdateProps]);

export type RulePatchProps = t.TypeOf<typeof RulePatchProps>;
export const RulePatchProps = t.intersection([TypeSpecificPatchProps, SharedPatchProps]);

export type RuleResponse = t.TypeOf<typeof RuleResponse>;
export const RuleResponse = t.intersection([SharedResponseProps, TypeSpecificResponse]);

// -------------------------------------------------------------------------------------------------
// Rule preview schemas

// TODO: Move to the rule_preview subdomain

export type PreviewRulesSchema = t.TypeOf<typeof previewRulesSchema>;
export const previewRulesSchema = t.intersection([
  SharedCreateProps,
  TypeSpecificCreateProps,
  t.type({ invocationCount: t.number, timeframeEnd: t.string }),
]);

export interface RulePreviewLogs {
  errors: string[];
  warnings: string[];
  startedAt?: string;
  duration: number;
}

export interface PreviewResponse {
  previewId: string | undefined;
  logs: RulePreviewLogs[] | undefined;
  isAborted: boolean | undefined;
}
