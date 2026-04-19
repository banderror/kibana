# Bug Report Template

Use this template for unexpected behavior, errors, crashes, or regressions.

GitHub issue type: **Bug**

## Template

```markdown
## Description

<!-- Clear, concise description of the bug -->

## Steps to Reproduce

1. ...
2. ...
3. ...

## Expected Behavior

<!-- What should happen -->

## Actual Behavior

<!-- What actually happens. Include error messages, stack traces, or screenshots if available. -->

## Environment

- **Kibana version**: 
- **Elasticsearch version**: 
- **Deployment**: <!-- Serverless / Hosted / On-prem -->
- **Browser** (if UI bug): 

## Impact

<!-- How many users are affected? Is there a workaround?
     Severity: Critical (data loss, security) / High (broken feature, no workaround) / Medium (broken, workaround exists) / Low (cosmetic, minor) -->

## Screenshots / Logs

<!-- If relevant. Redact any sensitive information (customer data, credentials). -->

## Additional Context

<!-- Related issues, recent changes that might have caused this, etc. -->
```

## Drafting guidance

When populating this template from the user's description:

- **Description**: Extract the core problem. Be specific about what's broken.
- **Steps to Reproduce**: Pull from the user's description. Number each step. If the user doesn't provide steps, leave blank and ask during the interview.
- **Expected vs Actual**: Separate these clearly. The user often describes only one; infer the other if obvious.
- **Environment**: Extract any version or deployment info mentioned. Leave blank fields for the interview.
- **Impact**: Look for clues about severity and scope. Ask if not clear.
- If the bug involves customer data or security details, flag that this should go in `elastic/security-team` instead of `elastic/kibana`.
