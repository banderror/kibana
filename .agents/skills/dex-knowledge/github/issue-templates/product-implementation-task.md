# Product implementation task template

One of the concrete engineering tasks from the implementation plan to deliver a product feature. Describes the **what** and **how** — the exact changes to make. Part of a product epic.

GitHub issue type: **Task**

## Template

```markdown
**Epic:** <!-- link to parent epic -->
**Depends on:** <!-- link to blocking issues/PRs, if any -->
**Related to:** <!-- link to related issues/PRs -->

## Summary

<!-- What needs to be done and how, in 1-3 sentences. -->

## Details

<!-- Implementation details: what exactly needs to be done and, if known, how.
     Describe technical approach, API changes, etc. -->

## Todo

<!-- A list of specific actions or steps, if known -->
- [ ] ...

## Resources

<!-- Links to design documents, RFCs, Figma files, POC PRs, etc. -->
```

## Drafting guidance

- **Epic / Depends on**: Always link to the parent epic. Note dependencies and blocking issues.
- **Summary**: Concise statement of what this task delivers. Reference the parent epic for broader context.
- **Details**: This is the core section. Describe the implementation plan clearly enough that an engineer can pick it up. Include technical approach, affected code areas, API changes, migration steps, etc.
- **Resources**: Link to design docs, RFCs, POC PRs, or other reference material.
- Product implementation tasks are execution-focused. If background context is needed, reference the parent epic rather than duplicating it.