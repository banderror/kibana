#!/bin/bash
# Post-refine script for dex-ticket-refine skill.
# Sets the GitHub issue type via GraphQL and optionally sets/removes the parent issue.
#
# Usage:
#   bash post_refine.sh --repo elastic/kibana --issue 12345 --type Bug
#   bash post_refine.sh --repo elastic/kibana --issue 12345 --parent-repo elastic/security-team --parent-issue 9876
#   bash post_refine.sh --repo elastic/kibana --issue 12345 --remove-parent

set -euo pipefail

REPO=""
ISSUE_NUMBER=""
ISSUE_TYPE=""
PARENT_REPO=""
PARENT_ISSUE=""
REMOVE_PARENT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --repo) REPO="$2"; shift 2 ;;
    --issue) ISSUE_NUMBER="$2"; shift 2 ;;
    --type) ISSUE_TYPE="$2"; shift 2 ;;
    --parent-repo) PARENT_REPO="$2"; shift 2 ;;
    --parent-issue) PARENT_ISSUE="$2"; shift 2 ;;
    --remove-parent) REMOVE_PARENT=true; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$REPO" || -z "$ISSUE_NUMBER" ]]; then
  echo "Error: --repo and --issue are required" >&2
  exit 1
fi

OWNER="${REPO%%/*}"
NAME="${REPO##*/}"

# Get the issue node ID (needed for all operations)
ISSUE_DATA=$(gh api graphql \
  -f query='
    query($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        issue(number: $number) {
          id
          parent { id number repository { nameWithOwner } }
        }
      }
    }
  ' \
  -f owner="$OWNER" -f name="$NAME" -F number="$ISSUE_NUMBER")

ISSUE_ID=$(echo "$ISSUE_DATA" | jq -r '.data.repository.issue.id')

if [[ -z "$ISSUE_ID" || "$ISSUE_ID" == "null" ]]; then
  echo "Error: Could not find issue #$ISSUE_NUMBER in $REPO" >&2
  exit 1
fi

# Set issue type if specified
if [[ -n "$ISSUE_TYPE" ]]; then
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

# Set parent issue if specified
if [[ -n "$PARENT_REPO" && -n "$PARENT_ISSUE" ]]; then
  PARENT_OWNER="${PARENT_REPO%%/*}"
  PARENT_NAME="${PARENT_REPO##*/}"

  PARENT_ID=$(gh api graphql \
    -f query='
      query($owner: String!, $name: String!, $number: Int!) {
        repository(owner: $owner, name: $name) {
          issue(number: $number) { id }
        }
      }
    ' \
    -f owner="$PARENT_OWNER" -f name="$PARENT_NAME" -F number="$PARENT_ISSUE" \
    --jq '.data.repository.issue.id')

  if [[ -z "$PARENT_ID" || "$PARENT_ID" == "null" ]]; then
    echo "Warning: Could not find parent issue #$PARENT_ISSUE in $PARENT_REPO" >&2
  else
    gh api graphql \
      -f query='
        mutation($parentId: ID!, $childId: ID!) {
          addSubIssue(input: { issueId: $parentId, subIssueId: $childId, replaceParent: true }) {
            issue { url }
            subIssue { url }
          }
        }
      ' \
      -f parentId="$PARENT_ID" -f childId="$ISSUE_ID" > /dev/null

    echo "Parent set to: $PARENT_REPO#$PARENT_ISSUE"
  fi
fi

# Remove parent issue if requested
if [[ "$REMOVE_PARENT" == "true" ]]; then
  CURRENT_PARENT_ID=$(echo "$ISSUE_DATA" | jq -r '.data.repository.issue.parent.id // empty')

  if [[ -z "$CURRENT_PARENT_ID" ]]; then
    echo "No parent issue to remove"
  else
    CURRENT_PARENT_REPO=$(echo "$ISSUE_DATA" | jq -r '.data.repository.issue.parent.repository.nameWithOwner')
    CURRENT_PARENT_NUMBER=$(echo "$ISSUE_DATA" | jq -r '.data.repository.issue.parent.number')

    gh api graphql \
      -f query='
        mutation($parentId: ID!, $childId: ID!) {
          removeSubIssue(input: { issueId: $parentId, subIssueId: $childId }) {
            issue { url }
            subIssue { url }
          }
        }
      ' \
      -f parentId="$CURRENT_PARENT_ID" -f childId="$ISSUE_ID" > /dev/null

    echo "Removed parent: $CURRENT_PARENT_REPO#$CURRENT_PARENT_NUMBER"
  fi
fi