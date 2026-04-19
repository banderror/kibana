# GitHub labels

## Type labels

Labels that correspond to ticket types. Examples:

- Bug: `bug`
- Feature: `enhancement`
- Technical task: `technical debt`, `refactoring`

## Team labels

Labels that describe the team responsible for or affected by the ticket.

For the Rule Management team, always add these 3 labels:

- `Team:Detection Rule Management` (immediate team)
- `Team:Detections and Resp` (parent team)
- `Team: SecuritySolution` (organization)

For the Detection Engine team, always add these 3 labels:

- `Team:Detection Engine` (immediate team)
- `Team:Detections and Resp` (parent team)
- `Team: SecuritySolution` (organization)

For other teams, query github repo to find the most appropriate team labels.

## Feature labels

Labels that specify the product area that the issue is related to.

General areas:

- `Feature:Detection Rules` - anything related to detection rules and Detection Engine; use only when a more specific feature label doesn't exist
- `Feature:Detection Alerts/Rules RBAC`

Rule management and monitoring:

- `Feature:Rule Management` - rule management workflows, page, and table
- `Feature:Rule Monitoring` - rule monitoring workflows and table
- `Feature:Prebuilt Detection Rules` - prebuilt rule installation, upgrade, customization, and export-import workflows
- `Feature:Rule Import/Export`
- `Feature:Rule MITRE ATT&CK®` - MITRE ATT&CK® Coverage page
- `Feature:Related Integrations`

Rule creation and editing:

- `Feature:Rule Creation` - rule creation page
- `Feature:Rule Edit` - rule editing page
- `Feature:Detection Rule Preview`

Rule actions and exceptions:

- `Feature:Rule Actions`
- `Feature:Rule Exceptions`
- `Feature:Rule Value Lists`

Rule execution and alerts generation:

- `Feature:Rule Execution` - anything related to detection rule execution logic
- `Feature:Detection Alerts` - anything related to detection alert generation
- `Feature:Alert Suppression`

Specific rule types of Detection Engine:

- `Feature:Custom Query Rule`
- `Feature:Event Correlation (EQL) Rule`
- `Feature:Threshold Rule`
- `Feature:Indicator Match Rule`
- `Feature:ML Rule`
- `Feature:New Terms Rule`

## Impact label

Used to communicate impact and urgency of bugs. Every bug ticket should have one of these:

- `impact:critical` - start addressing and fixing immediately
- `impact:high` - plan to fix in the current or next release cycle (quarter)
- `impact:medium` - plan to fix at some point later, maybe together with other related issues from the backlog
- `impact:low` - maybe fix later or never

## Other common labels

- `triage_needed` - always add to new tickets
- `good first issue` - low hanging fruit, very easy to address
