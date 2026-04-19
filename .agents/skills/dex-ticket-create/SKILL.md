---
name: dex-ticket-create
description: "Create a new GitHub issue in the elastic organization. Guides the user through drafting the content (title, description), choosing the right repo, labels, issue type, and projects. Supports feature requests, bug reports, and technical tasks. Use /dex-ticket-create when you want to file a ticket for one of the Detection Engineering Experience teams: Rule Management or Detection Engine."
user-invocable: true
disable-model-invocation: true
---

# Create GitHub issue

Guide the user through creating a well-structured GitHub issue in the `elastic` organization. The workflow has three phases, each ending with explicit user approval before proceeding.

## Restrictions

- Use the `gh` CLI for all GitHub interactions
- DO NOT use the GitHub API directly
- DO NOT use any GitHub MCP servers

## Prerequisites

The `gh` CLI must be authenticated with the `repo` scope. For adding issues to GitHub Projects, the `project` scope is also needed:

```bash
gh auth refresh -s project
```

## Phase 1: Draft the ticket

### Step 1.1: Understand the user request

The user's prompt contains the initial description. Extract:

- What needs to happen or what's broken
- Why it matters (motivation, impact, urgency)
- Any technical details, reproduction steps, or context

If the description is too vague to classify or draft from, ask one or two targeted clarifying questions. Otherwise, proceed directly.

### Step 1.2: Classify the ticket type

Determine whether this is a **feature**, **bug**, or **technical task**:

| Type | Signals |
|------|---------|
| Bug | broken, crash, error, fails, regression, unexpected behavior, not working |
| Feature | new functionality, enhancement, user-facing improvement, "add support for", "allow", "should be able to" |
| Technical task | refactoring, tech debt, infrastructure, performance, internal tooling, cleanup — no direct user-visible behavior change |

If ambiguous, ask the user which type applies.

### Step 1.3: Draft the ticket description

Read the corresponding template from the skill's `references/templates/` directory:

- Bug: `references/templates/bug.md`
- Feature: `references/templates/feature.md`
- Technical task: `references/templates/technical_task.md`

Using the user's description and the template, draft the ticket:

- Populate as many template fields as possible from the user's input
- Apply reasonable inference, but leave fields blank where no information is available — do not invent details

### Step 1.4: Draft the ticket title

- Draft a concise title (under 80 characters) that captures the core ask or problem
- Prefix with the relevant area in brackets:
  - use `[Security Solution]` prefix for anything related to Security Solution: Rule Management, Detection Engine, Timeline, Cases, etc
  - use other frequently used prefixes when apparent, e.g. `[Discover]`, `[Fleet]`, etc

### Step 1.5: Interview for weak spots

Review the draft. For fields that are empty, vague, or could be stronger:

- Ask one question at a time, then wait for the user's reply
- Prioritize required fields first, then optional ones
- Accept "skip" or "N/A" for optional fields
- If an answer is still vague after one follow-up, move on

### Step 1.6: Present and iterate

- Present the complete draft (title + body) formatted as it will appear in the issue.
- Ask the user for feedback. If the user requests changes, adjust accordingly.
- Iterate until the user approves the draft.
- **Wait for explicit approval before moving to Phase 2.**

## Phase 2: Determine the ticket metadata

Based on the ticket type, title and description, determine the appropriate repository, issue type, labels, and projects.

### Step 2.1: Choose repository

Read `references/github-repositories.md` for repo configuration.

Propose the most appropriate repository:

- Default: `elastic/kibana` (public bugs, features, technical tasks)
- Use `elastic/security-team` when the content is confidential (customer data, security vulnerabilities, internal infra) or is a high-level product item (initiative, workstream, epic)

### Step 2.2: Choose issue type

Propose the most appropriate GitHub issue type (set after creation via GraphQL):

- Feature → `Enhancement`
- Bug → `Bug`
- Technical task → `Task`

### Step 2.3: Choose labels

Read `references/github-labels.md` for label conventions.

Propose the most appropriate GitHub labels:

- **Type-related label** - e.g. `bug` for bugs
- **Team labels** - add all relevant ones based on the teams involved or affected
- **Feature labels** - add all relevant ones, but avoid adding general ones if more specific ones apply (e.g. skip `Feature:Detection Rules` if `Feature:Rule Management` applies)
- Query the github repo for any other relevant labels, if needed

### Step 2.4: Choose projects

Read `references/github-projects.md` for which projects apply to which ticket types.

Propose the most appropriate GitHub projects to add the issue to, if any.

### Step 2.5: Present and iterate

- Present the proposed metadata with brief reasoning.
- Ask the user for feedback. If the user requests changes, adjust accordingly.
- Iterate until the user approves the metadata.
- **Wait for explicit approval before moving to Phase 3.**

## Phase 3: Create the ticket

### Step 3.1: Final summary and confirmation

Present a complete summary of everything that will be created:

```
Repository:   elastic/kibana
Title:        [Area] Short description
Type:         Bug
Labels:       bug
              impact:critical
              Team:Detection Rule Management
              Team:Detections and Resp
              Team: SecuritySolution
              Feature:Prebuilt Detection Rules
Project(s):   #699

--- Body ---
<full issue body>
```

Tell the user: "This is the final review. Once you confirm, I'll create the issue." **Wait for explicit confirmation.**

### Step 3.2: Create the issue

After the user confirms:

```bash
ISSUE_BODY=$(cat <<'ISSUE_EOF'
<formatted body>
ISSUE_EOF
)

ISSUE_URL=$(gh issue create \
  --repo <REPO> \
  --title "<TITLE>" \
  --body "$ISSUE_BODY" \
  --label "<label1>,<label2>" \
  2>&1 | tail -1)

echo "Created: $ISSUE_URL"
```

### Step 3.3: Set issue type and add to projects

Extract the issue number from the URL, then run the post-creation script to set the issue type and optionally add to projects:

```bash
ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -o '[0-9]*$')

bash <path-to-this-skill>/scripts/post_create.sh \
  --repo <REPO> \
  --issue "$ISSUE_NUMBER" \
  --type "<ISSUE_TYPE>" \
  [--project <PROJECT_NUMBER>]
```

Replace `<path-to-this-skill>` with the actual path to this skill's directory.

### Step 3.4: Report the result

Print the final issue URL. If any post-creation steps failed (e.g. missing project scope), report what failed and how to fix it:

```
Issue created: https://github.com/elastic/kibana/issues/12345
Type set to: Bug
Added to project: #699

(If failed) Could not add to project #1880 — run: gh auth refresh -s project
```
