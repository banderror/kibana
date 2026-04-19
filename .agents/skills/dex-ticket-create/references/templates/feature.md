# Feature Request Template

Use this template for new functionality, enhancements, or user-facing improvements.

GitHub issue type: **Enhancement**

## Template

```markdown
## What?

<!-- Describe what feature should be added. Note what's explicitly out of scope. -->

## Why?

<!-- Why should this be added? What use-case does this enable?
     How do users work around this today? Who would use this? -->

## Acceptance Criteria

<!-- List conditions that must be true for this feature to be complete.
     Each criterion should be independently verifiable — if you can't write a test for it, make it more specific.
     Cover: happy path, edge cases (empty state, error state), affected user roles, deployment targets (Serverless/Hosted/On-prem). -->

**Happy path**
- [ ] ...

**Edge / error cases**
- [ ] ...

**Deployment & rollout**
- [ ] ...

## Priority

<!-- Nice to have / Important / Urgent / Critical -->

## Blocked By

<!-- Issue(s) that must be resolved first, e.g. #12345 -->

## Additional Context

<!-- Screenshots, mockups, links to related issues, or any other context -->
```

## Drafting guidance

When populating this template from the user's description:

- **What?**: Synthesize a clear statement of the feature. Note what's explicitly out of scope if apparent from the description.
- **Why?**: Derive motivation from the use-case. Include the current workaround (how users accomplish this today) and who the target user is.
- **Acceptance Criteria**: Draft from the described behavior. Include happy path and edge cases. Each criterion should be a binary pass/fail check.
- **Priority**: Infer if clues are present (e.g. "blocking", "nice to have"), otherwise leave for the user.
- **Blocked By**: Capture any mentioned dependencies.
