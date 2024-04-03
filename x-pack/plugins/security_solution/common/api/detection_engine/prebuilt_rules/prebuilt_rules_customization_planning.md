# Planning Prebuilt Rule Customization

Links:

- Users can Customize Prebuilt Detection Rules: Milestone 3 [#174168](https://github.com/elastic/kibana/issues/174168)
- Users can Customize Prebuilt Detection Rules [#1974](https://github.com/elastic/security-team/issues/1974)
- RFC for Prebuilt Rules Customization ([PR](https://github.com/elastic/kibana/pull/171856))

## Milestone 3: customizing prebuilt rules

Preparatory changes before starting to hide functionality behind a feature flag:

- Make changes in the API schema but keep them optional:
  - Add `rule_source` as an optional property to `RuleResponse`. Return `undefined` from the endpoints.
  - Add `rule_source` as an optional property to `RuleToImport`. Ignore it in the import endpoint.
- Make changes in the internal rule schema. Adjust `BaseRuleParams`: add `ruleSource` as an optional property and make `immutable` optional.
- Implement a Zod transformation from snake_case to camelCase and vice versa.
- Refactor rule management utilities. Consolidate them behind a new abstraction of `RuleManagementClient`.
- Add a new feature flag `prebuiltRulesCustomizationEnabled`.

----------------------------------------------------------------------------------------------------

_START changes hidden behind the `prebuiltRulesCustomizationEnabled` feature flag_

Common rule management workflows, API changes:

- Implement normalization on read for all endpoints. If `prebuiltRulesCustomizationEnabled` is `false`, normalize rule SO to `immutable` field only. If it's `true`, normalize rule SO to `immutable` and `rule_source` fields.
  - The `convertPrebuiltRuleAssetToRuleResponse` function should return `rule_source` of type `external`
- Implement initialization on write for rule creation API. Create new rules with `rule_source` and without `immutable`.
- Implement initialization on write for rule duplication API. Create new rules with `rule_source` and without `immutable` in the rules bulk actions endpoint when duplicating rules.
- Search by `rule_source` and fallback to `immutable`.
  - KQL filters and the `convertRulesFilterToKQL` method
  - `GET /rules/_rule_management_filters`
  - `/rules_coverage_overview`
  - `getExistingPrepackagedRules`: `/rules/prepackaged/_status`, `GET /prebuilt_rules/status`, `PUT /rules/prepackaged`, installation and upgrade `_review` and `_perform` endpoints
  - `getRuleStatsAggregation`: Detection Engine health API

Rule customization workflow, API changes:

- Implement migration on write for rule update API. Implement calculation of `is_customized`.
- Implement migration on write for rules bulk update API.
- Implement migration on write for rules bulk editing API.

Rule installation and upgrade workflows, API changes:

- Implement initialization on write for `POST /prebuilt_rules/installation/_perform_` API endpoint.
- Implement migration on write for `POST /prebuilt_rules/upgrade/_perform` API endpoint.
- Implement initialization and migration on write for legacy `PUT /rules/prepackaged` API endpoint.

Rule export and import workflows, API changes:

- Allow exporting prebuilt rules at the API level. Remove the checks that we currently do server-side to filter out prebuilt rules from the response payload.
- Allow importing prebuilt rules at the API level.



_END changes hidden behind the `prebuiltRulesCustomizationEnabled` feature flag_

----------------------------------------------------------------------------------------------------

Final changes and work to do before releasing the feature:

- Do comprehensive exploratory testing of the app with the `prebuiltRulesCustomizationEnabled` feature flag turned on:
  - Rule management workflows: creating, editing, bulk editing, duplicating custom rules; using the Rule Management and Details pages.
  - Rule installation workflow: installing prebuilt rules; using the Rule Management and Details pages.
  - Rule customization workflow: installing, editing, bulk editing, duplicating prebuilt rules; using the Rule Management and Details pages.
  - Rule upgrade workflow: installing, editing, bulk editing, upgrading prebuilt rules; using the Rule Management and Details pages.
  - Rule export and import workflows.
- Enable the `prebuiltRulesCustomizationEnabled` feature flag by default.
- Deprecate the `immutable` field.

Changes after releasing the feature:

- Remove the `prebuiltRulesCustomizationEnabled` feature flag. Make the `rule_source` property required in `RuleResponse`.

## Milestone 4: improving prebuilt rule installation and upgrade UX

Add `source_updated_at` field:

- ?
