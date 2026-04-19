#!/bin/bash
# Post-creation script for dex-ticket-create skill.
# Sets the GitHub issue type via GraphQL and optionally adds the issue to projects.
#
# Usage:
#   bash post_create.sh --repo elastic/kibana --issue 12345 --type Bug [--project 699] [--project 1880]

set -euo pipefail

REPO=""
ISSUE_NUMBER=""
ISSUE_TYPE=""
PROJECTS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --repo) REPO="$2"; shift 2 ;;
    --issue) ISSUE_NUMBER="$2"; shift 2 ;;
    --type) ISSUE_TYPE="$2"; shift 2 ;;
    --project) PROJECTS+=("$2"); shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$REPO" || -z "$ISSUE_NUMBER" ]]; then
  echo "Error: --repo and --issue are required" >&2
  exit 1
fi

OWNER="${REPO%%/*}"
NAME="${REPO##*/}"

# Set issue type if specified
if [[ -n "$ISSUE_TYPE" ]]; then
  # Query repo data and issue types in one call
  REPO_DATA=$(gh api graphql -f query='
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        id
        issueTypes(first: 50) {
          nodes { id name }
        }
      }
    }
  ' -f owner="$OWNER" -f name="$NAME")

  TYPE_ID=$(echo "$REPO_DATA" | jq -r --arg t "$ISSUE_TYPE" \
    '.data.repository.issueTypes.nodes[] | select(.name == $t) | .id')

  if [[ -z "$TYPE_ID" ]]; then
    echo "Warning: Issue type '$ISSUE_TYPE' not found in $REPO" >&2
  else
    # Get issue node ID
    ISSUE_ID=$(gh api graphql \
      -f query='
        query($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            issue(number: $number) { id }
          }
        }
      ' \
      -f owner="$OWNER" -f name="$NAME" -F number="$ISSUE_NUMBER" \
      --jq '.data.repository.issue.id')

    # Set the issue type
    gh api graphql \
      -f query='
        mutation($id: ID!, $typeId: ID!) {
          updateIssue(input: { id: $id, issueTypeId: $typeId }) {
            issue { url }
          }
        }
      ' \
      -f id="$ISSUE_ID" -f typeId="$TYPE_ID" > /dev/null

    echo "Issue type set to: $ISSUE_TYPE"
  fi
fi

# Add to projects
for PROJECT_NUM in "${PROJECTS[@]}"; do
  ISSUE_URL="https://github.com/$REPO/issues/$ISSUE_NUMBER"
  if gh project item-add "$PROJECT_NUM" --owner "$OWNER" --url "$ISSUE_URL" 2>/dev/null; then
    echo "Added to project #$PROJECT_NUM"
  else
    echo "Warning: Could not add to project #$PROJECT_NUM — you may need to run: gh auth refresh -s project" >&2
  fi
done
