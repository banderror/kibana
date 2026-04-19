# Technical epic template

Large technical effort: addressing complex tech debt, architecture improvements, performance, testing, reliability, dev tooling, etc. Contains multiple sub-tasks tracked independently.

GitHub issue type: **Epic**

## Template

```markdown
## Summary

<!-- What needs to be done and why, in 1-3 sentences. -->

## Background

<!-- Current situation, pain points, user and/or developer impact. -->

## Technical requirements

<!-- Technical requirements and goals. Remove this section if unknown or not available. -->

## Technical designs

<!-- Link to the technical RFC describing the proposed technical solution. Remove this section if not available. -->
RFC: [RFC name](RFC url)

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
- **Background**: Include relevant context — related incidents, prior efforts, scaling challenges. Remove this section if no background context is available.
- **Tasks**: Organize by category (e.g. "Frontend", "Backend", "Testing", "Incident follow-up"). Link to sub-issues.
- Technical epics are lean. The summary explains the "why", and the task list is the bulk of the content.