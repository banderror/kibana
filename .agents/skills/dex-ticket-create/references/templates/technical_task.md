# Technical Task Template

Use this template for refactoring, tech debt, infrastructure work, performance improvements, internal tooling, or other engineering tasks that don't directly change user-visible behavior.

GitHub issue type: **Task**

## Template

```markdown
## Summary

<!-- What needs to be done and why, in 1-3 sentences -->

## Background

<!-- Context and motivation. Why now? What problem does this solve?
     Link to any related discussions, incidents, or architectural decisions. -->

## Scope

**In scope:**
- ...

**Out of scope:**
- ...

## Approach

<!-- High-level technical approach or implementation plan.
     If there are multiple options, list them with trade-offs. -->

## Acceptance Criteria

- [ ] ...

## Dependencies

<!-- Related issues, PRs, or external dependencies that affect this work -->

## Additional Context

<!-- Relevant diagrams, metrics, links, or other supporting information -->
```

## Drafting guidance

When populating this template from the user's description:

- **Summary**: Capture both the what and the why in a concise statement.
- **Background**: Include the motivation. Technical tasks often stem from incidents, performance observations, or architectural decisions — capture that context.
- **Scope**: Being explicit about what's out of scope is especially important for technical tasks, which tend to expand. If the user doesn't mention boundaries, ask during the interview.
- **Approach**: Draft if the user provided technical details. Otherwise, leave for the interview — the user may want to discuss options.
- **Acceptance Criteria**: For technical tasks, these are often about measurable outcomes (latency targets, test coverage, migration completeness). Make them concrete.
