# Bug Report Template

Something is broken, crashes, errors, regresses, or behaves unexpectedly.

GitHub issue type: **Bug**

## Template

```markdown
**Related to:** <!-- links to related issues/PRs -->
**Location:** <!-- where in the product this occurs, e.g. "Rule Management page, Rule Updates table" -->

## Summary

<!-- Clear, concise description of the bug -->

## Steps to Reproduce

1. ...
2. ...
3. ...

## Expected Behavior

<!-- What should happen -->

## Actual Behavior

<!-- What actually happens. Include error messages, stack traces, or screenshots if available. -->

## Root Cause

<!-- If known or suspected. Remove this section if unknown. -->

## Environment

- **Kibana version**: 
- **Elasticsearch version**: 
- **Deployment**: <!-- Serverless / Hosted / On-prem -->
- **Browser** (if UI bug): 

## Impact

<!-- How many users are affected? Is there a workaround?
     Severity: Critical (data loss, security, OOM) / High (broken feature, no workaround) / Medium (broken, workaround exists) / Low (cosmetic, minor) -->

## Screenshots / Logs

<!-- If relevant. Redact any sensitive information (customer data, credentials). -->

## Additional Context

<!-- Related issues, recent changes that might have caused this, etc. -->
```

## Drafting guidance

- **Related to / Location**: Always include at the top. Location helps readers quickly understand where in the product this occurs.
- **Summary**: Extract the core problem. Be specific about what's broken.
- **Steps to Reproduce**: Pull from the user's description. Number each step. Include pre-requisites if needed. If the user doesn't provide steps, leave blank and ask during the interview.
- **Expected vs Actual**: Separate these clearly. The user often describes only one; infer the other if obvious.
- **Root Cause**: Include only if the user provides root cause analysis. Remove the section entirely if unknown.
- **Environment**: Extract any version or deployment info mentioned. Leave blank fields for the interview.
- **Impact**: Look for clues about severity and scope. The impact level here maps to the `impact:*` label in Phase 2 (critical/high/medium/low).
- If the bug involves customer data or security details, flag that this should go in `elastic/security-team` instead of `elastic/kibana`.