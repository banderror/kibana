# Product epic template

Large or complex product feature, or a group of related features and fixes. Spans multiple releases. Created by Product Manager or Engineering Manager.

GitHub issue type: **Epic**

## Template

```markdown
**Related to:** <!-- links to related issues/PRs, if any -->

## Summary

<!-- What needs to be done and why, in 1-3 sentences. -->

## Background and rationale

<!-- Current situation, pain points, customer impact.
     Include data, customer examples, or enhancement requests if available. -->

## Value / impact

<!-- Business value, strategic alignment. -->

## Product requirements

<!-- Link to the Product Requirements Document (PRD), if available. -->
PRD: [PRD name](PRD url)

### User stories

<!-- Key user stories. Can also be defined in linked sub-issues. -->
- As a [persona], I want to [action] so that [outcome].

### Success criteria

<!-- Conditions that must be true for this epic to be considered complete.
     Can also be defined in linked sub-issues. -->
- [ ] ...

### Subscription tier (recommendation)

<!-- License: Basic / Plati­num / Enter­prise -->
<!-- Serverless PLI: Elastic Security Serverless (if available in Serverless) -->
<!-- Serverless tier: Essentials / Complete -->

## Product designs

<!-- Link to Figma or other design files. -->

## Technical requirements

<!-- Non-functional requirements, if there are any. -->

## Technical designs

<!-- Link to the technical RFC describing the proposed software design and architecture, if available. -->
RFC: [RFC name](RFC url)

## Related tickets

<!-- Enhancement requests, SDHs, customer asks, related epics, etc. -->

## Implementation plan

<!-- Implementation phases and steps linking to individual tickets. -->

### Phase 1 — ...
- [ ] #ticket1
- [ ] #ticket2

### Phase 2 — ...
- [ ] #ticket3

## Release progress checklist

<!-- Track readiness across design, implementation, testing, docs, and release -->
- [ ] UX design is done
- [ ] Architecture design is done and approved
- [ ] Implementation plan is created
- [ ] Upcoming work is communicated to Docs team
- [ ] Test plan is written and approved
- [ ] Implementation is done
- [ ] Automated tests are written
- [ ] Acceptance testing is done
- [ ] Exploratory testing is done
- [ ] Documentation is written
- [ ] Feature is released in Serverless
- [ ] Feature is ready to be released in ESS
```

## Drafting guidance

- **Summary**: Brief overview of the epic's scope.
- **Background and rationale**: This is the most important section for product epics. Include data, customer quotes, competitive comparisons, and enhancement request links when available.
- **User stories**: Define key user stories inline or note they're in sub-issues. Focus on the personas affected.
- **Success criteria**: High-level criteria. Detailed criteria can live in sub-issues.
- **Implementation plan**: Organize by phases if the epic has a phased approach. Link to sub-issues.
- **Release progress checklist**: Adapt to the epic's needs — not every item applies to every epic.
- Product epics are rich documents. Include as much context as the user provides.