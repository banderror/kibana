---
name: dex-knowledge
description: "Shared knowledge base for Detection Engineering Experience (DEX) skills. Contains GitHub configuration (repositories, labels, projects, ticket types, issue templates) used by dex-ticket-create, dex-ticket-refine, and other DEX skills. Not invocable directly."
user-invocable: false
disable-model-invocation: true
---

# DEX Knowledge Base

Shared reference data for Detection Engineering Experience skills.

## Contents

### `github/` — GitHub configuration and conventions

- `github-repositories.md` — Repository descriptions and selection criteria
- `github-labels.md` — Label conventions (mandatory, type, team, feature, impact)
- `github-projects.md` — Project board assignments by ticket type
- `github-ticket-types.md` — Ticket type hierarchy, classification guide, repo defaults, title prefixes, issue type mapping

### `github/issue-templates/` — Issue body templates

One template per ticket type (10 total): product/technical initiatives, workstreams, epics, features, product/technical implementation tasks, and bugs.