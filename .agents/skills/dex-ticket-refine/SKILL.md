---
name: dex-ticket-refine
description: "Refine and enrich an existing GitHub issue in the elastic organization. Reads the ticket, analyzes it against DEX issue templates and conventions, interviews the user to fill gaps, and proposes improvements to title, description, labels, projects, issue type, and parent issue. Use /dex-ticket-refine when you want to improve, enrich, or clean up an existing ticket for one of the Detection Engineering Experience teams: Rule Management or Detection Engine."
user-invocable: true
disable-model-invocation: true
---

# Refine GitHub issue

Guide the user through refining an existing GitHub issue in the `elastic` organization. The workflow has four phases, each ending with explicit user approval before proceeding.

## Restrictions

- Use the `gh` CLI for all GitHub interactions
- DO NOT use the GitHub API directly
- DO NOT use any GitHub MCP servers

## Prerequisites

The `gh` CLI must be authenticated with the `repo` scope. For modifying project membership, the `project` scope is also needed:

```bash
gh auth refresh -s project
```

## Phase 1: Read the ticket

### Step 1.1: Resolve the ticket

The user may provide:

- **A full URL**: `https://github.com/elastic/kibana/issues/12345` — extract repo and number directly
- **A number**: `12345` — try `elastic/kibana` first, then `elastic/security-team`
- **Nothing** — ask the user for a ticket URL or number

Only `elastic/kibana` and `elastic/security-team` are supported. If the URL points to a different repo, tell the user this skill is designed for DEX repos and stop.

For number-only input:

```bash
# Try elastic/kibana first
gh issue view <NUMBER> --repo elastic/kibana --json url --jq '.url' 2>/dev/null

# If exit code != 0, try elastic/security-team
gh issue view <NUMBER> --repo elastic/security-team --json url --jq '.url' 2>/dev/null
```

If both fail, report: "Issue #N was not found in elastic/kibana or elastic/security-team."

### Step 1.2: Fetch full issue data

Fetch standard fields via `gh`:

```bash
gh issue view <NUMBER> --repo <REPO> --json number,title,body,labels,assignees,milestone,projectItems,state,url
```

Fetch fields that `gh issue view` cannot return (issue type, parent, sub-issues) via GraphQL:

```bash
gh api graphql \
  -f owner="<OWNER>" -f name="<NAME>" -F number=<NUMBER> \
  -f query='
    query($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        issue(number: $number) {
          id
          issueType { id name }
          parent { number title url repository { nameWithOwner } }
          subIssues(first: 50) {
            nodes { number title url state }
          }
          subIssuesSummary { total completed percentCompleted }
        }
      }
    }
  '
```

Save the issue `id` from the GraphQL response — it's needed later for mutations.

### Step 1.3: Present current state

Display all fetched data in a structured summary:

```
Issue:        elastic/kibana#12345
URL:          https://github.com/elastic/kibana/issues/12345
State:        OPEN
Title:        [Security Solution] Some title here
Issue type:   Bug
Labels:       bug, Team:Detection Rule Management, ...
Projects:     #699 (Security: Detection Rule Management)
Assignees:    @user1, @user2
Milestone:    (none)
Parent:       elastic/security-team#9876 — [Epic] Parent epic title
Sub-issues:   3 (2 completed, 1 open)

--- Body ---
<full body text>
```

If the issue state is CLOSED, warn the user: "This issue is closed. Do you still want to refine it?" Continue only if confirmed.

Wait for the user to acknowledge before proceeding.

## Phase 2: Analyze and interview

### Step 2.1: Classify the ticket type

Read `../dex-knowledge/github/github-ticket-types.md` for the full classification guide.

Classify the existing ticket using these signals (in priority order):

1. The existing GitHub issue type (if set) — strongest signal
2. Labels (e.g. `bug`, `enhancement`, `Epic`, `technical debt`)
3. Title prefix (`[Initiative]`, `[Epic]`, `[Workstream]`, `[Security Solution]`)
4. Body content and structure

If ambiguous, ask the user. Knowing the ticket type is essential for selecting the correct template.

### Step 2.2: Template gap analysis

Read the corresponding template from `../dex-knowledge/github/issue-templates/`:

| Ticket type | Template file |
| --- | --- |
| Product initiative | `product-initiative.md` |
| Technical initiative | `technical-initiative.md` |
| Product workstream | `product-workstream.md` |
| Technical workstream | `technical-workstream.md` |
| Product epic | `product-epic.md` |
| Technical epic | `technical-epic.md` |
| Feature | `feature.md` |
| Product implementation task | `product-implementation-task.md` |
| Technical implementation task | `technical-implementation-task.md` |
| Bug | `bug.md` |

Compare the ticket body section-by-section against the template. For each template section, mark it as:

- **Present** — the section exists and has meaningful content
- **Empty** — the section heading exists but contains only placeholder text or is blank
- **Missing** — the section does not exist in the body

Produce a gap report summarizing the findings.

### Step 2.3: General quality analysis

Beyond template compliance, check for:

- **Vague language** — words like "sometimes", "seems to", "might", "various", "etc." without specifics
- **Missing acceptance criteria** — for features and epics, check if success criteria are concrete and testable
- **Unclear scope** — for epics, check if scope boundaries are defined
- **Title quality** — is the title specific enough? Does it have the correct prefix per `../dex-knowledge/github/github-ticket-types.md`?
- **Label completeness** — compare current labels against expected labels for the ticket type per `../dex-knowledge/github/github-labels.md`:
  - Mandatory labels (e.g. `triage_needed`)
  - Type labels (e.g. `bug`, `enhancement`, `Epic`)
  - Team labels (3 labels per team)
  - Feature labels (specific product area)
  - Impact label (for bugs: `impact:critical/high/medium/low`)
- **Project membership** — compare current projects against expected per `../dex-knowledge/github/github-projects.md`
- **Issue type** — is it set? Does it match the ticket type per the mapping in `../dex-knowledge/github/github-ticket-types.md`?
- **Parent issue** — for implementation tasks, features, and bugs that belong to an epic, is the parent set?

### Step 2.4: Interview the user

Present the combined findings from steps 2.2 and 2.3 as a prioritized list. Then ask clarifying questions:

- Ask one question at a time, then wait for the user's reply
- Prioritize: (1) missing required template sections, (2) vague content in existing sections, (3) metadata gaps (labels, type, projects), (4) optional improvements
- Accept "skip" or "N/A" for optional items
- If an answer is still vague after one follow-up, move on

After the interview, confirm with the user that all questions have been addressed before moving to Phase 3.

## Phase 3: Propose changes

### Step 3.1: Draft proposed changes

Based on the analysis and interview answers, draft changes to:

- **Title** — if prefix is wrong, title is vague, or user requested a change
- **Description** — enriched with template sections, filled gaps, improved language
- **Labels** — add missing mandatory/type/team/feature/impact labels; remove incorrect ones
- **Projects** — add to projects per the assignment guidance; remove from incorrect ones
- **Issue type** — set or correct per the ticket type mapping
- **Parent issue** — set or change if the user identifies one during the interview

Do NOT change: assignees, milestone, sub-issues.

### Step 3.2: Present current vs proposed

Show a diff-style comparison for each changed field:

```
=== Proposed Changes ===

TITLE:
  Current:  [Security Solution] Fix the thing
  Proposed: [Security Solution] Fix rule duplication when importing NDJSON with duplicate rule_id values

ISSUE TYPE:
  Current:  (not set)
  Proposed: Bug

LABELS:
  Add:      bug, impact:high, Team:Detection Rule Management, Team:Detections and Resp, Team: SecuritySolution, triage_needed
  Remove:   (none)
  Keep:     Feature:Rule Import/Export

PROJECTS:
  Add:      #699
  Remove:   (none)

PARENT ISSUE:
  Current:  (none)
  Proposed: elastic/security-team#5678

DESCRIPTION:
  <show full proposed body>
```

If no changes are needed for a field, omit it from the comparison. If no changes are needed at all, report: "This ticket looks good! No changes needed." and stop.

### Step 3.3: Iterate until approved

Ask the user for feedback. Adjust as requested. Iterate until the user approves all changes. **Wait for explicit approval before moving to Phase 4.**

## Phase 4: Apply changes

### Step 4.1: Final confirmation

Present a compact summary of all changes to be applied. Tell the user: "This is the final review. Once you confirm, I'll apply these changes." **Wait for explicit confirmation.**

### Step 4.2: Apply changes via gh CLI

Use `gh issue edit` for title, body, labels, and projects. Only include flags for fields that actually changed:

```bash
ISSUE_BODY=$(cat <<'ISSUE_EOF'
<full new body>
ISSUE_EOF
)

gh issue edit <NUMBER> --repo <REPO> \
  --title "<NEW_TITLE>" \
  --body "$ISSUE_BODY" \
  --add-label "label1" --add-label "label2" \
  --remove-label "old_label" \
  --add-project "Project Title" \
  --remove-project "Old Project Title"
```

Only include `--title` if title changed, `--body` if body changed, etc.

### Step 4.3: Apply changes via GraphQL

If issue type or parent issue changed, run the post-refine script:

```bash
bash <path-to-this-skill>/scripts/post_refine.sh \
  --repo <REPO> \
  --issue <NUMBER> \
  [--type "<ISSUE_TYPE>"] \
  [--parent-repo <PARENT_REPO> --parent-issue <PARENT_NUMBER>] \
  [--remove-parent]
```

Replace `<path-to-this-skill>` with the actual path to this skill's directory.

### Step 4.4: Report the result

Print the issue URL and a summary of what was changed:

```
Issue updated: https://github.com/elastic/kibana/issues/12345

Changes applied:
  Title:       updated
  Description: updated
  Labels:      added bug, impact:high; removed (none)
  Projects:    added #699
  Issue type:  set to Bug
  Parent:      set to elastic/security-team#5678

(If any step failed) Could not add to project #1880 — run: gh auth refresh -s project
```

If any step failed, report what failed and how to fix it. Do not roll back successful changes if a later step fails.