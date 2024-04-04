# Draft plan for Milestone 3

## Design

### Technical design

- [ ] https://github.com/elastic/kibana/issues/171309
- [ ] https://github.com/elastic/kibana/issues/147239
- [ ] https://github.com/elastic/kibana/pull/148913

### UI/UX design

- [ ] Design rule upgrade UI for rule type changes https://github.com/elastic/security-team/issues/7126
- [ ] https://github.com/elastic/kibana/issues/178211
- [ ] https://github.com/elastic/kibana/discussions/178867

## Preparatory changes

Preparatory changes is something we can work on before starting to hide functionality behind a feature flag. This will reduce the overall complexity introduced by feature toggling.

### Missing UI for editing certain rule fields

Context: https://github.com/elastic/kibana/issues/147239#issuecomment-1849887326

- [ ] https://github.com/elastic/kibana/issues/173595
- [ ] https://github.com/elastic/kibana/issues/173594
- [ ] https://github.com/elastic/kibana/issues/173626
- [ ] https://github.com/elastic/kibana/issues/173593
- [ ] https://github.com/elastic/kibana/issues/178280

### Schema-related changes

- [ ] Implement a Zod transformation from snake_case to camelCase and vice versa.
- [ ] Make changes in the API schema but keep them optional:
  - Add `rule_source` as an optional property to `RuleResponse`. Return `undefined` from the endpoints.
  - Add `rule_source` as an optional property to `RuleToImport`. Ignore it in the import endpoint.
- [ ] Make changes in the internal rule schema. Adjust `BaseRuleParams`: add `ruleSource` as an optional property and make `immutable` optional.
- [ ] Search by `rule_source` and fallback to `immutable`.
  - KQL filters and the `convertRulesFilterToKQL` method
  - `GET /rules/_rule_management_filters`
  - `/rules_coverage_overview`
  - `getExistingPrepackagedRules`: `/rules/prepackaged/_status`, `GET /prebuilt_rules/status`, `PUT /rules/prepackaged`, installation and upgrade `_review` and `_perform` endpoints
  - `getRuleStatsAggregation`: Detection Engine health API
  - Fix existing Telemetry for detection rules and take into account the new `ruleSource` parameter with a fallback to `immutable`

### Other preparatory changes

- [ ] Refactor rule management utilities. Consolidate them behind a new abstraction of `RuleManagementClient`. Encapsulate the migration-on-write and normalization-on-read logic in it.
- [ ] Add a new feature flag `prebuiltRulesCustomizationEnabled`.

## Changes hidden behind the feature flag

These are changes that will need to be hidden behind the `prebuiltRulesCustomizationEnabled` feature flag.

### Rule management, API changes

- [ ] Implement normalization on read for all endpoints. If `prebuiltRulesCustomizationEnabled` is `false`, normalize rule SO to `immutable` field only. If it's `true`, normalize rule SO to `immutable` and `rule_source` fields.
  - The `convertPrebuiltRuleAssetToRuleResponse` function should return `rule_source` of type `external`
- [ ] Implement initialization on write for rule creation API. Create new rules with `ruleSource` and without `immutable`.
- [ ] Implement initialization on write for rule duplication API. Create new rules with `ruleSource` and without `immutable` in the rules bulk actions endpoint when duplicating rules.
- [ ] Evaluate doing migration on write on enabling/disabling for a small number of rules.

### Rule customization, API changes

- [ ] Implement migration on write for rule update API. Implement calculation of `is_customized`.
- [ ] Implement migration on write for rules bulk update API.
- [ ] Implement migration on write for rules bulk editing API.

### Rule installation and upgrade, API changes

- [ ] Implement initialization on write for `POST /prebuilt_rules/installation/_perform_` API endpoint.
- [ ] Implement migration on write for `POST /prebuilt_rules/upgrade/_perform` API endpoint.
- [ ] Implement initialization and migration on write for legacy `PUT /rules/prepackaged` API endpoint.
- [ ] Refactor the diff model. Implement the terms "solvable conflict" and "non-solvable conflict" in the code.
- [ ] Return user-customized fields from the `POST /prebuilt_rules/upgrade/_review_` API endpoint even if they haven't been updated by Elastic in the target version.
- [ ] https://github.com/elastic/kibana/issues/166376
- [ ] https://github.com/elastic/kibana/issues/148191
    - [ ] Use main ticket as investigation ticket for deciding which algorithms to use for each field
    - [ ] Create separate tickets for each concrete diff algorithm implementation 
- [ ] https://github.com/elastic/kibana/issues/166388
    - [ ] Split ticket into different tickets, each for one of the subtasks

### Rule export and import, API changes

- [ ] Allow exporting prebuilt rules at the API level. Remove the checks that we currently do server-side to filter out prebuilt rules from the response payload.
- [ ] Allow importing prebuilt rules at the API level.

### Rule management, UI changes

- [ ] Support filtering by "custom", "prebuilt customized", and "prebuilt non-customized".
- [ ] Show if the rule is customized on the Rule Details page.

### Rule customization, UI changes

- [ ] Add support for editing prebuilt rules to the Rule Management and Rule Details pages. Single and bulk actions should work for prebuilt rules, such as editing, bulk editing, export, etc.
- [ ] Add support for editing prebuilt rules to the Rule Editing page.

### Rule installation and upgrade, UI changes

- [ ] https://github.com/elastic/kibana/issues/171520
- [ ] https://github.com/elastic/security-team/issues/7126
- [ ] Update filtering to allow by: Elastic rules and Customized Elastic rules

### Rule export and import, UI changes

- [ ] Support exporting prebuilt rules from the Rule Management page. Remove checks that prevent from / handle exporting prebuilt rules in the bulk actions UI.
- [ ] Support exporting prebuilt rules from the Rule Details page.

### Telemetry

- [ ] https://github.com/elastic/kibana/issues/140369

## Before release

### Bugs

- [x] https://github.com/elastic/kibana/issues/161543
- [ ] https://github.com/elastic/kibana/issues/178611
- [ ] https://github.com/elastic/kibana/issues/178615
- [ ] https://github.com/elastic/kibana/issues/166166
- [ ] Replace PATCH logic with PUT when upgrading rules
- [ ] https://github.com/elastic/kibana/issues/174847
- [ ] Installing prebuilt rules by 2 users at the same time causes rules to be duplicated
- [ ] It's possible to import a custom rule that has the same `rule_id` than an existing prebuilt rule, if this prebuilt rule is not installed. Importing a custom rule with a `rule_id` copied from a prebuilt rule, then installing prebuilt rules after that and ended up with 2 rules (custom and prebuilt) with the same `rule_id`.
- [ ] https://github.com/elastic/kibana/issues/178221
- [ ] https://github.com/elastic/security-team/issues/8816
- [ ] https://github.com/elastic/security-team/issues/8644
- [ ] https://github.com/elastic/infosec/issues/15731
- [ ] https://github.com/elastic/kibana/issues/177283

### Testing

- [ ] https://github.com/elastic/kibana/issues/166215
- [ ] Do acceptance testing of the app with the `prebuiltRulesCustomizationEnabled` feature flag turned on.
- [ ] Do comprehensive exploratory testing of the app with the `prebuiltRulesCustomizationEnabled` feature flag turned on:
  - Rule management workflows: creating, editing, bulk editing, duplicating custom rules; using the Rule Management and Details pages.
  - Rule installation workflow: installing prebuilt rules; using the Rule Management and Details pages.
  - Rule customization workflow: installing, editing, bulk editing, duplicating prebuilt rules; using the Rule Management and Details pages.
  - Rule upgrade workflow: installing, editing, bulk editing, upgrading prebuilt rules; using the Rule Management and Details pages.
  - Rule export and import workflows.
  - Disable the `prebuiltRulesCustomizationEnabled` feature flag after using the app with the flag enabled. Test that the app works without issues and errors.

### Documentation

- [ ] Document prebuilt rule customization and upgrade workflows.

### Final changes before releasing the feature

- [ ] Enable the `prebuiltRulesCustomizationEnabled` feature flag by default.
- [ ] Deprecate the `immutable` field. Document the deprecation.
- [ ] Make the `rule_source` property required in `RuleResponse`.
- [ ] Document the `rule_source` property in the API docs.

## After release

- [ ] Do additional exploratory testing of the app in production.
- [ ] Remove the `prebuiltRulesCustomizationEnabled` feature flag.

## TODO: sort these out

Other changes for existing rule fields:

- [ ] Prevent from updating "non-customizable" fields in prebuilt rules via the API. Examples: `author`, `license`, etc. Prevent their update for _prebuilt rules_. The fields would remain part of the rule schema, but we would add manual checks in the endpoints that reject the update with 400 if the request tries to update those fields. ([comment](https://github.com/elastic/kibana/issues/147239#issuecomment-1893848718))
- [ ] Hide `alert_suppression` in the diff UI. ([comment](https://github.com/elastic/kibana/issues/147239#issuecomment-1893848718))
- [ ] Handle the deprecated/unused `output_index` and `namespace` fields. Don't create UI to edit them. In the endpoint, always return the user's value. No diff should ever show up for these fields. ([comment](https://github.com/elastic/kibana/issues/147239#issuecomment-1893848718))
- [ ] Handle the `meta` field. This field should be deprecated and eliminated eventually. So, for now, in the endpoint, always return the user's value. No diff should ever show up for this field. ([comment](https://github.com/elastic/kibana/issues/147239#issuecomment-1893848718))
