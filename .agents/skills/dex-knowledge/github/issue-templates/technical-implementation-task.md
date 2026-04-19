# Technical Implementation Task Template

Concrete technical work: refactoring, tech debt, performance optimization, testing, infrastructure, dev tooling, etc. No direct user-visible behavior change. Can be part of a technical epic or standalone.

GitHub issue type: **Task**

## Template

```markdown
**Epic:** <!-- link to parent epic, if any -->
**Related to:** <!-- link to related issues/PRs -->

## Summary

<!-- What needs to be done and why, in 1-3 sentences -->

## TODO

<!-- Specific tasks or steps, if known -->
- [ ] ...
```

## Drafting guidance

- **Epic / Related to**: Link to the parent epic if this task is part of one. Link related issues, PRs, or prior work.
- **Summary**: Brief statement of what needs to happen and why. Often references prior work, incidents, or upstream changes that motivate the task.
- **TODO**: List specific sub-steps if the task has multiple parts. Keep it simple — a checklist is often enough.
- Technical implementation tasks are lean. If the user provides more context (approach options, performance targets, migration details), include a **Details** section between Summary and TODO.