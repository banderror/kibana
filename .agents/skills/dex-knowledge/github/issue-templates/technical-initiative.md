# Technical initiative template

Top-level technical goal spanning a broad area: testing coverage, reliability, platform migration, performance, developer tooling, etc. Spans multiple quarters. Decomposes into technical epics.

GitHub issue type: **Initiative**

## Template

```markdown
## Summary

<!-- What needs to be done and why, in 1-3 sentences. -->

## Background

<!-- What is the current situation? What problem exists? Why does this matter strategically? -->

## Goals

<!-- What does this initiative aim to achieve? 2-5 bullet points. -->

## Workstreams

<!-- Linked workstreams that belong to this initiative. Remove this section if no workstreams. -->

## Milestones

<!-- Epics that implement this initiative. Linked directly or through the workstreams. Grouped into milestones for prioritization. -->

### Milestone 1 — ...
- [ ] #epic1
- [ ] #epic2

### Milestone 2 — ...
- [ ] #epic3

### Not prioritized
- [ ] #epic4
- [ ] #epic5

## Related links

<!-- Related issues, discussions, incidents, etc. -->
```

## Drafting guidance

- **Summary**: Capture the broad technical goal and why it matters now. Technical initiatives often stem from incidents, scaling challenges, or accumulated tech debt.
- **Goals**: List concrete, measurable outcomes where possible (e.g. "reduce flakiness to zero", "all tests automated").
- **Milestones**: List any known sub-epics. Often populated later.
- Keep it lean — technical initiatives are about direction, not implementation details.