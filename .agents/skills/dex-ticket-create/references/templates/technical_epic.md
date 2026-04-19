# Technical Epic Template

Large technical effort: addressing complex tech debt, architecture improvements, performance, testing, reliability, dev tooling, etc. Contains multiple sub-tasks tracked independently.

GitHub issue type: **Epic**

## Template

```markdown
## Summary

<!-- What needs to be done and why, in 1-3 sentences -->

## Tasks

<!-- Categorized list of linked sub-issues -->

### Category 1
- [ ] #ticket1
- [ ] #ticket2

### Category 2
- [ ] #ticket3
```

## Drafting guidance

- **Summary**: Brief statement of the technical goal and why it matters. Often references prior work, incidents, or milestones that created the debt.
- **Tasks**: Organize by category (e.g. "Frontend", "Backend", "Testing", "Incident follow-up"). Link to sub-issues.
- Technical epics are lean. The summary explains the "why", and the task list is the bulk of the content.
- If the user provides background context (related incidents, prior efforts), include a brief **Background** section between Summary and Tasks.