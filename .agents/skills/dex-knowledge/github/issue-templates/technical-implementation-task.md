# Technical implementation task template

Concrete technical work: refactoring, tech debt, performance optimization, testing, infrastructure, dev tooling, etc. No direct user-visible behavior change. Can be part of a technical epic or standalone.

GitHub issue type: **Task**

## Template

```markdown
**Epic:** <!-- link to parent epic, if any -->
**Depends on:** <!-- link to blocking issues/PRs, if any -->
**Related to:** <!-- link to related issues/PRs -->

## Summary

<!-- What needs to be done and why, in 1-3 sentences. -->

## Details

<!-- Implementation details: what exactly needs to be done and, if known, how.
     Describe technical approach, API changes, etc. -->

## Todo

<!-- A list of specific actions or steps, if known -->
- [ ] ...

## Resources

<!-- Links to RFCs, benchmarks, related incidents, POC PRs, etc. -->
```

## Drafting guidance

- **Epic / Related to**: Link to the parent epic if this task is part of one. Link related issues, PRs, or prior work.
- **Summary**: Brief statement of what needs to happen and why. Often references prior work, incidents, or upstream changes that motivate the task.
- **Details**: Include implementation approach, affected code areas, performance targets, migration details. Remove this section if not needed.
- **Todo**: List specific sub-steps if the task has multiple parts. Keep it simple — a checklist is often enough.
- Technical implementation tasks are lean.