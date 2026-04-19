---
name: gh-create-issue
description: Create a new GitHub issue in the elastic organization. Guides the user through drafting the content (title, description), choosing the right repo, labels, issue type, and projects. Supports feature requests, bug reports, and technical tasks. Use /gh-create-issue when you want to file a ticket.
disable-model-invocation: true
---

# Create GitHub Issue

Guide the user through creating a well-structured GitHub issue in the `elastic` organization. The workflow has three phases, each ending with explicit user approval before proceeding.

## Prerequisites

The `gh` CLI must be authenticated with the `repo` scope. For adding issues to GitHub Projects, the `project` scope is also needed:

```bash
gh auth refresh -s project
```

## Phase 1: Draft the Content

### Step 1 — Understand the request

The user's prompt contains the initial description. Extract:
- What needs to happen or what's broken
- Why it matters (motivation, impact, urgency)
- Any technical details, reproduction steps, or context

If the description is too vague to classify or draft from, ask one or two targeted clarifying questions. Otherwise, proceed directly.

### Step 2 — Classify the ticket type

Determine whether this is a **feature**, **bug**, or **technical task**:

| Type | Signals |
|------|---------|
| Bug | broken, crash, error, fails, regression, unexpected behavior, not working |
| Feature | new functionality, enhancement, user-facing improvement, "add support for", "allow", "should be able to" |
| Technical task | refactoring, tech debt, infrastructure, performance, internal tooling, cleanup — no direct user-visible behavior change |

If ambiguous, ask the user which type applies.

### Step 3 — Draft the issue

Read the corresponding template from the skill's `references/templates/` directory:

- Feature: `references/templates/feature.md`
- Bug: `references/templates/bug.md`
- Technical task: `references/templates/technical_task.md`

Using the user's description and the template, draft the issue:
- Populate as many template fields as possible from the user's input
- Apply reasonable inference, but leave fields blank where no information is available — do not invent details
- Draft a concise title (under 80 characters) that captures the core ask or problem
- Prefix with the relevant area in brackets if apparent (e.g. `[Discover]`, `[Detection Engine]`, `[Fleet]`)

### Step 4 — Interview for weak spots

Review the draft. For fields that are empty, vague, or could be stronger:
- Ask one question at a time, then wait for the user's reply
- Prioritize required fields first, then optional ones
- Accept "skip" or "N/A" for optional fields
- If an answer is still vague after one follow-up, move on

### Step 5 — Present and iterate

Show the complete draft (title + body) formatted as it will appear in the issue. Ask the user for feedback and iterate until they approve. **Wait for explicit approval before moving to Phase 2.**

## Phase 2: Determine Metadata

### Step 6 — Propose repository and properties

Read `references/repositories.md` for repo and project configuration, and `references/labels.md` for label conventions.

Based on the ticket content and type, propose:

1. **Repository**
   - Default: `elastic/kibana` (public bugs, features, technical tasks)
   - Use `elastic/security-team` when the content is confidential (customer data, security vulnerabilities, internal infra) or is a high-level product item (initiative, workstream, epic)

2. **Issue type** (GitHub issue types, set after creation via GraphQL):
   - Feature → `Enhancement`
   - Bug → `Bug`
   - Technical task → `Task`

3. **Labels** — refer to `references/labels.md` for the team's conventions. Typically include:
   - A type-related label (e.g. `bug` for bugs)
   - The team label
   - Area or feature labels as relevant

4. **Projects** — refer to `references/repositories.md` for which projects apply to which ticket types

Present the proposed metadata with brief reasoning. **Wait for the user to approve or request changes.**

### Step 7 — Iterate on metadata

If the user requests changes, adjust accordingly. Once approved, proceed to Phase 3.

## Phase 3: Create the Issue

### Step 8 — Final summary and confirmation

Present a complete summary of everything that will be created:

```
Repository:  elastic/kibana
Title:       [Area] Short description
Type:        Bug
Labels:      bug, Team:Security, area:detection-engine
Project(s):  #699

--- Body ---
<full issue body>
```

Tell the user: "This is the final review. Once you confirm, I'll create the issue." **Wait for explicit confirmation.**

### Step 9 — Create the issue

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

### Step 10 — Set issue type and add to projects

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

### Step 11 — Report the result

Print the final issue URL. If any post-creation steps failed (e.g. missing project scope), report what failed and how to fix it:

```
Issue created: https://github.com/elastic/kibana/issues/12345
Type set to: Bug
Added to project: #699

(If failed) Could not add to project #1880 — run: gh auth refresh -s project
```
