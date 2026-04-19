# Ticket types

## Hierarchy

```
Initiative (product or technical)
  └── Workstream (product or technical, groups related epics)
       └── Epic (product or technical)
            └── Feature (user-facing enhancement, describes what/why)
            └── Product implementation task (engineering work for product features, describes what/how)
            └── Technical implementation task (tech debt, perf, testing, infra, etc.)
            └── Bug
```

Higher-level items (initiatives, workstreams, epics) are decomposed into lower-level items:

- An initiative decomposes into workstreams (optional) and/or epics.
- A workstream decomposes into epics.
- A product epic decomposes into features and product implementation tasks.
- A technical epic decomposes into technical implementation tasks.
- Bugs can belong to any epic or exist independently.
- Some features may exist independently.
- Some technical implementation tasks may exist independently.

The hierarchy is enforced via native parent-child relationships between GitHub issues.

## Classification guide

Use the table below to classify the user's request. If ambiguous, ask the user.

| # | Type | Signals | Scope |
|---|------|---------|-------|
| 1 | Product initiative | Broad product goal, multi-quarter/multi-year, strategic, spans multiple workstreams or epics | Largest product item |
| 2 | Technical initiative | Broad technical goal (testing coverage, reliability, platform migration), spans multiple technical epics | Largest technical item |
| 3 | Product workstream | Groups related product epics under an initiative, represents a product area or user workflow, no fixed end date | Groups epics |
| 4 | Technical workstream | Groups related technical epics under a technical initiative, no fixed end date | Groups epics |
| 5 | Product epic | Large/complex product feature or a group of related features and bugs, multi-release timeline, multiple independent work items | Large product effort |
| 6 | Technical epic | Large technical effort (tech debt, performance, architecture, testing), multiple sub-tasks | Large technical effort |
| 7 | Feature | New functionality or enhancement, user-facing, single deliverable. Describes the **what** and **why** (requirements), not the how. | Single deliverable |
| 8 | Product implementation task | Concrete engineering task to do as part of the epic's implementation plan to deliver a feature. Describes the **what** and **how**. Part of a product epic. | Single implementation step |
| 9 | Technical implementation task | Concrete technical work: refactoring, tech debt, performance, testing, infra, tooling. No direct user-visible behavior change. Can be part of a technical epic or standalone. | Single technical task |
| 10 | Bug | Something is broken, crashes, errors, regresses, or behaves unexpectedly | Fix |

### Distinguishing similar types

**Feature vs Product implementation task**: A feature describes requirements for stakeholders (what and why). A product implementation task describes a single implementation step in the implementation plan (what and how). An epic may decompose into both: features define what needs to happen, implementation tasks define how it gets built.

**Product epic vs Feature**: If it spans multiple surfaces (API + UI), involves multiple independent deliverables, or has a multi-release timeline, it's an epic. If it's a single focused deliverable, it's a feature.

**Technical epic vs Technical implementation task**: If it contains multiple sub-tasks that can be tracked independently, it's an epic. If it's a single focused piece of work, it's a task.

**Product initiative vs Product epic**: Initiatives are strategic, multi-quarter goals. Epics are concrete efforts with defined scope and deliverables. An initiative may contain multiple epics.

## Repository defaults

| Type | Default repo | Notes |
|------|-------------|-------|
| Product initiative | `elastic/security-team` | Always. No exceptions. |
| Technical initiative | `elastic/kibana` | Can also use `elastic/security-team` |
| Product workstream | `elastic/security-team` | Always. No exceptions. |
| Technical workstream | `elastic/kibana` | Can also use `elastic/security-team` |
| Product epic | `elastic/security-team` | Always. No exceptions. |
| Technical epic | `elastic/kibana` | Can also use `elastic/security-team` |
| Feature | `elastic/kibana` | Use `elastic/security-team` if confidential |
| Product implementation task | `elastic/kibana` | Use `elastic/security-team` if confidential |
| Technical implementation task | `elastic/kibana` | Use `elastic/security-team` if confidential |
| Bug | `elastic/kibana` | Use `elastic/security-team` if confidential (customer data, security vulnerabilities, SDHs) |

## Title prefix

| Type | In `elastic/security-team` | In `elastic/kibana` |
|------|---------------------------|---------------------|
| Product initiative | `[Initiative]` | N/A |
| Technical initiative | `[Initiative]` | `[Security Solution]` |
| Product workstream | `[Workstream]` | N/A |
| Technical workstream | `[Workstream]` | `[Security Solution]` |
| Product epic | `[Epic]` | N/A |
| Technical epic | `[Epic]` | `[Security Solution]` |
| Feature | `[Security Solution]` | `[Security Solution]` |
| Product implementation task | `[Security Solution]` | `[Security Solution]` |
| Technical implementation task | `[Security Solution]` | `[Security Solution]` |
| Bug | `[Security Solution]` | `[Security Solution]` |

## GitHub issue type

| Ticket type | GitHub issue type |
|-------------|-------------------|
| Product initiative | `Initiative` |
| Technical initiative | `Initiative` |
| Product workstream | `Workstream` |
| Technical workstream | `Workstream` |
| Product epic | `Epic` |
| Technical epic | `Epic` |
| Feature | `Enhancement` |
| Product implementation task | `Task` |
| Technical implementation task | `Task` |
| Bug | `Bug` |