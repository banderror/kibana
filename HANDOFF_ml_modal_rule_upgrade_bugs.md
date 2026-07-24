# Handoff: ML jobs modal blocks / silently fails prebuilt rule upgrades

This document hands off two related bugs so another agent can pick up the fix work. The GitHub tickets hold the full problem statements, root causes, and proposed fixes. This document adds the operational context that is not in the tickets, reproduction, and what's left.

## Links

- Slack (team cross-post): https://elastic.slack.com/archives/C0B7YAUDDB5/p1784225323593619
- Bug 1 ticket (modal on every upgrade): https://github.com/elastic/kibana/issues/239884
- Bug 2 ticket (rule details page silent failure): https://github.com/elastic/kibana/issues/279791
- Related SDH (internal): https://github.com/elastic/sdh-security-team/issues/1698
- Steven de Salas write-ups (external, context only):
  - https://github.com/sdesalas/kibana-knowledge/blob/main/reports/rule-details-update-silently-fails-with-legacy-ml-jobs.md
  - https://github.com/sdesalas/kibana-knowledge/blob/main/reports/ml-jobs-upgrade-modal-blocks-all-rule-upgrades.md
- Full Option E design: `~/.claude/plans/tidy-crafting-lagoon.md`

## People

- **Kseniia Ignatovych** — PM; approved Option E; co-assignee on #239884.
- **Steven de Salas** — initial external analysis.
- **Austin Eakin** — Solutions Engineer; reported it for the customer; can provide a live repro.

## The two bugs in one paragraph

Both bugs are triggered by the same condition: at least one installed ML job whose ID is in `affected_job_ids.ts`. Bug 1 (#239884) was that the "ML rule updates may override your existing rules" modal gated every prebuilt rule upgrade, even non-ML rules, and re-prompted each time. Bug 2 (#279791) was that on the rule details and rule editing pages that same modal was never mounted, so the confirmation Promise never resolved and "Update rule" silently did nothing. Both are now resolved by **Option E** (see Current status): the modal is deleted and coverage loss is surfaced as a `machine_learning_job_id` three-way-diff conflict.

## Current status

Both bugs are resolved by **Option E** (see below): the modal is deleted, and legacy-ML-job coverage loss is now surfaced through the prebuilt-rule **three-way-diff conflict** mechanism on the `machine_learning_job_id` field.

- Option E implemented on branch `fix-ml-rule-upgrade`
- Code is committed, draft PR opened: https://github.com/elastic/kibana/pull/279931
- **Implementation is not final** — still being actively refined (see "What's left" §1–2).
- Local gates green: plugin typecheck, cypress typecheck, eslint, i18n_check.
- E2E specs written + typechecked but **not run** (need a live stack).
- Branch history is messy — clean it up before marking the PR ready for review.

Commits (oldest→newest): `dc6b4e9` Fix #279791 · `b441bc3` + `7139f98` interim modal fixes (**superseded** — they patch the now-deleted modal) · `d49c884` Option E initial (37 files) · `dc2d417` ML-compatibility callout (dismissible fix, see §1) · `87179581` **unrelated** kbn-babel-preset `styled_components_files.js` change (rebase artifact — drop it during cleanup) · `8a65a59` proper `machine_learning_job_id` diff algorithm (set-based + comprehensive tests + helper move, see §1). The handoff doc itself is **staged but uncommitted** (the old `TEMP COMMIT` was reset).

## What shipped (Option E)

Full design + locked decisions: `~/.claude/plans/tidy-crafting-lagoon.md`. Summary:

- **Modal deleted** (`use_ml_jobs_upgrade_modal/` and all its wiring).
- **Server:** a shared pure helper `isMlJobCoverageLossUpgrade(current, target)` in `common/detection_engine/prebuilt_rules/diff/`, plus a custom `machine_learning_job_id` three-way-diff algorithm that treats the field as an **unordered set of job ids** (order / duplicate / `string`-vs-single-element-array differences are not treated as updates) and forces a **`NON_SOLVABLE`** conflict on coverage loss (merged = current → default keeps the user's job, preserving coverage). Swapped in at `calculate_three_way_rule_fields_diff.ts`.
- **Client guardrail (critical invariant):** a narrowly-scoped `hasMlCoverageLossConflict` signal derived only from the ML field diff, **independent of `isRulesCustomizationEnabled`**. The existing `hasUnresolvedConflicts` gates are left untouched — do **not** widen them, or below-Enterprise users get soft-bricked on every conflict type.
- **Per-rule gate:** the row shows "Review" (opens the flyout) instead of "Update"; below-Enterprise, "Update" is disabled until coverage loss is acknowledged. The read-only diff tab surfaces the warning two ways (an `EuiCallOut` **and** a per-field badge were both shipped for comparison — pick one).
- **Bulk:** a below-Enterprise "Update all to Elastic's version" action, reusing the shared conflicts modal.

## What's left

1. **Finish the fix (not final yet):**
   - ✅ **DONE — ML-compatibility callout no longer dismissible-forever.** `rule_management_ui/components/ml_job_compatibility_callout/index.tsx` no longer uses `CallOutSwitcher` (which persisted a permanent localStorage dismiss for `type: 'primary'`). It now renders the base `CallOut` driven by `useTimedDismissal` (`public/common/hooks/use_timed_dismissal.ts`) with a **content-fingerprinted storage key**: `kibana.securitySolution.detections.mlJobCompatibilityCallout.${hash(installed job ids ∈ affectedJobIds)}.dismissedAt` (`object-hash`, mirroring `entity_analytics_read_privileges_callout.tsx`). Chosen scope (user-approved): **timed (7-day default, matches the sibling deprecated-rules callout) + immediate re-surface on any change to the installed affected-job set**. An outer gate + inner renderer keyed on the fingerprint ensures the once-at-mount `useTimedDismissal` reads the correct set-specific key despite async job loading and re-reads when the set changes; no change to the shared hook. Tests extended (`index.test.tsx`, 7 cases incl. dismiss/persist-within-window/re-surface-on-set-change). Gates green: jest, scoped typecheck (0 errors from this change; pre-existing `@inversifyjs/container` `unbindAllAsync` errors in `core/di`+`alerting_v2` are environmental, unrelated — need `yarn kbn bootstrap`), eslint, i18n. Still pending: live-stack manual verify (see §3). Copy left as-is (the "V3 jobs" body text is itself stale post-9.4 `_ea` rename — treated as a separate concern) and severity kept `'primary'`.
   - ✅ **DONE — `machine_learning_job_id` diff algorithm made set-based + comprehensively tested.** It now canonicalizes each version (dedupe + sort) so cosmetic differences (order, duplicates, `string` vs single-element array) are not treated as updates; it delegates outcome/merge to `simpleDiffAlgorithm` on the canonical form and restores the verbatim original value, then applies the coverage-loss `NON_SOLVABLE` override on top. Built via TDD (tests written to the intended spec first, 3 cosmetic cases went red, then the impl was fixed). The `isMlJobCoverageLossUpgrade` helper moved from `common/machine_learning/` to `common/detection_engine/prebuilt_rules/diff/` (colocated with the diff; `affectedJobIds` hoisted to a module-level `Set`); all 3 source importers updated (server diff algo, client `use_prebuilt_rules_upgrade_state.ts`, colocated test). Tests: diff algorithm **20 cases**, helper **7 cases** — all green; touched files type-clean via IDE diagnostics.
   - **Ad-hoc manual cleanup / polish** of the Option E implementation — no fixed checklist, done interactively. Includes deciding callout-vs-badge in the read-only diff tab and removing the unused one.
2. **Manual-test data-setup scripts** — a dev harness to repeatably seed the failing state: a legacy ML job by id, prebuilt rule assets, and an installed upgradeable rule. Reuse the helpers in Reproduction below (likely extend `security_solution/scripts/quickstart/`, which has ES/Kibana clients + a rules module but no ML-job or prebuilt-asset module).
3. **Test on a live stack** — manual test on **both** Enterprise and a basic license (via the §2 scripts); run the E2E on CI.
4. **Clean up branch history before PR** — drop/squash the superseded `b441bc3` + `7139f98`; drop the unrelated `87179581` kbn-babel-preset commit; commit the handoff doc (currently staged); consider squashing the `Fix 239884: *` commits into one.
5. *(optional)* finish two test-plan docs: `prebuilt_rule_upgrade_with_preview.md`, `prebuilt_rule_upgrade_without_preview.md`.
6. **Update PR** https://github.com/elastic/kibana/pull/279931.

## Reproduction

Neither bug reproduces on a clean stack — you need an installed anomaly-detection job whose id is in `affected_job_ids.ts`. Two ways in:

- **UI / e2e:** install a Security AD job with an allowlisted id. Stock ML modules now install only modern `_ea` jobs, so the legacy job must be created explicitly.
- **Unit / integration:** mock `useInstalledSecurityJobs` to return a job whose id is in the allowlist.

**Which ids count as "affected"** (version-dependent — always check the file): V1 = bare `linux_*` / `windows_*` / `rare_process_*`; V2 = `v2_*`; V3 non-EA = `v3_*` not ending in `_ea`. Safe to ignore: `auth_*`, `high_count_*`, anything `*_ea`.

**Reusable tooling** (base path `x-pack/solutions/security/test/security_solution_cypress/` — note: *not* under `plugins/`):

- **Legacy ML job by id:** Cypress `createMlJob` (`cypress/support/machine_learning.ts` — `PUT /internal/ml/anomaly_detectors/{jobId}` in the `security` group), or the FTR `ml.createAnomalyDetectionJob(jobConfig)` service (`x-pack/platform/test/functional/services/ml/api.ts`) for an arbitrary id.
- **Non-Cypress prebuilt-rule helpers** (need ES `Client` + `supertest`): `security_solution_api_integration/test_suites/detections_response/utils/rules/prebuilt_rules/` → `create_prebuilt_rule_saved_objects.ts`, `install_prebuilt_rules.ts`, `set_up_rule_upgrade.ts`.
- **Canonical worked example** wiring all three: `.../cypress/e2e/detection_response/rule_management/prebuilt_rules/upgrade/upgrade_with_legacy_ml_jobs.cy.ts` (asset `machine_learning_job_id: ['v2_windows_rare_metadata_user']` → `['v3_windows_rare_metadata_user_ea']`).

## Verification

- Unit: `node scripts/jest <testPathPattern>` (config auto-discovered from the test path).
- FE-integration **gotcha**: `__integration_tests__` is ignored by the default jest config — run via `node scripts/jest_integration --config <.../rules_upgrade/jest.integration.config.js> <pattern>`.
- Types (scoped, never unscoped): `node scripts/type_check --project x-pack/solutions/security/plugins/security_solution/tsconfig.json`. **This takes 10+ min for this plugin** — while iterating, prefer per-file IDE TS-server diagnostics (near-instant) and save the full scoped `type_check` for finalizing. Gotcha: after moving/renaming a file, a stale `target/types/*.tsbuildinfo` can report a phantom `cannot find module` error for the old path (it's only in the build cache, not source) — it clears on the next real typecheck.
- Lint: `node scripts/eslint --fix $(git diff --name-only)`; i18n: `node scripts/i18n_check --fix`.
- Combined local gate: `node scripts/check.js --scope=branch`.

## What `affected_job_ids.ts` actually is (read this to understand the whole feature)

`x-pack/solutions/security/plugins/security_solution/common/machine_learning/affected_job_ids.ts` is a **hardcoded allowlist of superseded (legacy) Security ML job IDs** — job generations that the *current* prebuilt ML rules have moved away from. Its only purpose is to answer one question: "does this user have an older-generation ML job installed?" so the UI can decide whether to *warn*.

`affectedJobIds` now has **two consumers** (verified by code search):

- `.../rule_management_ui/components/ml_job_compatibility_callout/index.tsx` — a **non-blocking banner** on the Rule Management page. Now dismissible-with-re-surface via `useTimedDismissal` (7-day window) keyed on a hash of the installed affected-job set (re-appears when that set changes); it was previously a persisted-forever `CallOutSwitcher` (`namespace="detections"`) — see What's left §1.
- `common/detection_engine/prebuilt_rules/diff/is_ml_job_coverage_loss_upgrade.ts` — the shared coverage-loss helper introduced by Option E, used **both client-side** (the `hasMlCoverageLossConflict` signal) **and server-side** (the `machine_learning_job_id` three-way-diff algorithm). (Moved here from `common/machine_learning/` in `8a65a59`.)

Before Option E the allowlist drove only the banner and the (now-deleted) blocking modal — purely UI warnings with no server-side effect. Option E changed that: the allowlist now drives the server diff and thus influences upgrade behavior (it forces a conflict), though it still never installs, repoints, or validates jobs directly.

**The meaning of "affected" has drifted across three eras** (which is why the file and its copy are confusing today):

- **2021 (8.x, #94393):** introduced the file + the banner. "Affected" = jobs tied to older ECS field conventions (the file header comment still says this).
- **2022 (8.3, #128334):** added the blocking modal. Rules were repointed V1/V2 → V3 jobs (detection-rules #1846), so V1/V2 became legacy.
- **2025 (9.4, #255339):** added the stock `v3_*` (non-`_ea`) jobs, because rules were repointed again V3 → V3 `_ea` (Entity Analytics rename). Plain `v3_*` jobs are now "legacy" too. This is why far more environments hit the modal after 9.4.

Unifying definition: **older ML job generations that the latest prebuilt rules no longer reference.** It is a moving target per release (see the per-version permalinks in the #239884 workaround comment), maintained manually and reactively. The actual rule→job wiring lives upstream in the detection-rules repo and is *not* enforced by this file.

**Why the warning exists at all:** upgrading a prebuilt ML rule silently repoints it from the (legacy) job you have installed to the new-generation job. If the legacy job was providing coverage, the upgraded rule now points elsewhere and the legacy job is orphaned → **silent coverage gap**. That silent repoint is exactly what Option E surfaces as a conflict. Its trigger is **content-based** — the rule's current vs. target `machine_learning_job_id`, computed server-side — so unlike the old modal and the banner it does not depend on which jobs are installed or on ML privileges.
