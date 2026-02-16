# Gemini.md - Project Constitution

> **This file is LAW.** It contains data schemas, behavioral rules, and architectural invariants.
> 
> Update only when:
> - A schema changes
> - A rule is added
> - Architecture is modified

---

## Project Metadata

| Field | Value |
|-------|-------|
| **Project Name** | TBD |
| **Created** | 2026-02-15 |
| **Protocol** | B.L.A.S.T. |
| **Current Phase** | 5 - Trigger (Complete) |
| **Status** | 🔴 In Progress |

---

## Data Schemas

### JIRA Ticket Schema (Input from JIRA API)

```json
{
  "ticket_id": "string (e.g., 'VMO-1')",
  "title": "string (fields.summary)",
  "issue_type": "string (fields.issuetype.name)",
  "status": "string (fields.status.name)",
  "priority": "string (fields.priority.name)",
  "labels": ["string array"],
  "components": ["string array"],
  "description": "string (ADF converted to plain text/markdown)",
  "acceptance_criteria": "string (customfield_10016 or parsed from description)",
  "comments": [
    {
      "author": "string",
      "body": "string",
      "created": "ISO datetime string"
    }
  ],
  "linked_issues": [
    {
      "type": "string (link type)",
      "key": "string",
      "summary": "string",
      "direction": "inward|outward"
    }
  ],
  "subtasks": [
    {
      "key": "string",
      "summary": "string",
      "status": "string"
    }
  ],
  "attachments": [
    {
      "filename": "string",
      "mimeType": "string"
    }
  ]
}
```

### Template Schema (Extracted from PDF)

```json
{
  "sections": [
    {
      "number": "string (e.g., '1', '1.1')",
      "title": "string (e.g., 'Introduction')",
      "subsections": [
        {
          "number": "string",
          "title": "string"
        }
      ]
    }
  ],
  "raw_text": "string (full extracted text)"
}
```

### Generation Request Schema (API Input)

```json
{
  "jira_ticket_id": "string (required)",
  "additional_context": "string (optional)",
  "llm_provider": "enum: 'groq' | 'ollama'",
  "llm_model": "string (e.g., 'llama-3.3-70b-versatile')",
  "temperature": "number (0.0 - 1.0, default: 0.3)",
  "max_tokens": "number (1000 - 8000, default: 4096)"
}
```

### Generated Test Plan Schema (API Output)

```json
{
  "test_plan_content": "string (markdown formatted)",
  "metadata": {
    "jira_ticket_id": "string",
    "title": "string",
    "llm_provider": "string",
    "llm_model": "string",
    "generated_at": "ISO datetime string",
    "template_sections_used": ["string array"]
  }
}
```

### History Record Schema (SQLite)

```json
{
  "id": "integer (auto-increment)",
  "jira_ticket_id": "string",
  "ticket_title": "string",
  "test_plan_content": "string (markdown)",
  "llm_provider": "string",
  "llm_model": "string",
  "created_at": "ISO datetime string",
  "updated_at": "ISO datetime string"
}
```

### Settings Schema (.env + SQLite)

```json
{
  "jira": {
    "base_url": "string (e.g., 'https://company.atlassian.net')",
    "email": "string",
    "api_token": "string (masked in API responses)"
  },
  "groq": {
    "api_key": "string (masked)",
    "default_model": "string"
  },
  "ollama": {
    "base_url": "string (default: 'http://localhost:11434')",
    "default_model": "string"
  },
  "llm": {
    "default_provider": "enum: 'groq' | 'ollama'",
    "temperature": "number",
    "max_tokens": "number"
  },
  "template": {
    "path": "string (default: '../testplan.pdf')"
  }
}
```

### Export Payload Schemas

**PDF Export:**
```json
{
  "content": "string (markdown test plan)",
  "jira_ticket_id": "string",
  "title": "string",
  "include_toc": "boolean (default: true)"
}
```

**DOCX Export:**
```json
{
  "content": "string (markdown test plan)",
  "jira_ticket_id": "string",
  "title": "string"
}
```

---

## Behavioral Rules

### System Behavior

1. **Stream Output** - All LLM generation must use Server-Sent Events (SSE) for real-time streaming
2. **Template Compliance** - Generated test plans must strictly follow the provided PDF template structure
3. **Context Handling** - Automatically truncate comments first, then linked issues if context window exceeded
4. **ADF Conversion** - Convert Atlassian Document Format to readable text before LLM processing
5. **Dual Storage** - Settings must persist to both `.env` file AND SQLite database

### Do Not Rules

1. **NEVER expose API keys to frontend** - All LLM and JIRA calls go through backend only
2. **NEVER download JIRA attachments** - Only show attachment names
3. **NEVER guess at business logic** - Prioritize reliability over speed
4. **NEVER write scripts in `tools/` until** - Discovery complete, Data Schema defined, Blueprint approved
5. **DO NOT proceed without valid connections** - Test all integrations in Phase 2 before building logic

### Tone & Style (UI/UX)

1. **Professional color scheme** - Dark sidebar/top nav with white/light content area, indigo/blue accent
2. **Clean typography** - Sans-serif (Inter or system font stack)
3. **Document-style output** - White card with shadow, proper typography hierarchy
4. **Loading states** - Skeleton loaders for JIRA fetch, pulsing animation for LLM generation
5. **Toast notifications** - Success/error feedback (e.g., "Settings saved", "Copied to clipboard")
6. **Responsive** - Works on 1024px+ screens (mobile optional)

---

## Architectural Invariants

### 3-Layer Architecture

1. **Layer 1: Architecture (`architecture/`)**
   - Technical SOPs in Markdown
   - Define goals, inputs, tool logic, edge cases
   - **Golden Rule:** If logic changes, update SOP before code

2. **Layer 2: Navigation**
   - Reasoning layer that routes data between SOPs and Tools
   - Orchestrates execution by calling tools in correct order
   - Does NOT perform complex tasks directly

3. **Layer 3: Tools (`tools/`)**
   - Deterministic Python scripts
   - Atomic and testable
   - Environment variables in `.env`
   - Use `.tmp/` for intermediate files

### File Structure

```
├── gemini.md          # Project Constitution (this file)
├── task_plan.md       # Phases, goals, checklists
├── findings.md        # Research, discoveries, constraints
├── progress.md        # What was done, errors, tests, results
├── .env               # API Keys/Secrets
├── architecture/      # Layer 1: SOPs
├── tools/             # Layer 3: Python Scripts
└── .tmp/              # Temporary Workbench (Intermediates)
```

---

## Maintenance Log

| Date | Action | Details |
|------|--------|---------|
| 2026-02-15 | Project Initialized | Created all memory files and constitution |
| 2026-02-15 | Phase 1 Complete | Answered 5 Discovery Questions, defined Data Schemas |

---

## Appendix: Discovery Questions (Phase 1)

Before proceeding, the following must be answered:

1. **North Star:** What is the singular desired outcome?
2. **Integrations:** Which external services (Slack, Shopify, etc.) do we need? Are keys ready?
3. **Source of Truth:** Where does the primary data live?
4. **Delivery Payload:** How and where should the final result be delivered?
5. **Behavioral Rules:** How should the system "act"? (Tone, logic constraints, "Do Not" rules)
