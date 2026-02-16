# Findings

> Project Memory: Research, Discoveries, Constraints

---

## Overview

This file tracks all research findings, discoveries, and constraints discovered during the project lifecycle.

---

## Discovery Phase (Phase 1)

### Project: TestPlan Agent - Intelligent Test Plan Generator

**Type:** Full-Stack Web Application (Local-hosted)

**Core Functionality:**
1. Fetch JIRA ticket data via REST API
2. Parse test plan template from PDF
3. Generate comprehensive test plans using LLM (Groq or Ollama)
4. Export results as PDF or DOCX
5. Maintain history in SQLite database

---

## Tech Stack Research

### Backend (Python 3.10+)
| Component | Technology | Purpose |
|-----------|------------|---------|
| Web Framework | FastAPI | API endpoints, SSE streaming |
| Database | SQLAlchemy + SQLite | History & settings persistence |
| PDF Parsing | pdfplumber | Extract template structure |
| PDF Generation | ReportLab or WeasyPrint | Export test plans as PDF |
| DOCX Generation | python-docx | Export test plans as Word |
| LLM (Cloud) | Groq SDK | Cloud LLM provider |
| LLM (Local) | Ollama SDK | Local LLM provider |
| Config | python-dotenv | .env file management |

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| HTTP Client | Axios/fetch |
| Markdown | react-markdown / markdown-to-jsx |

---

## Integration Requirements

### JIRA API v3
- **Auth:** Basic Auth (base64 encoded email:api_token)
- **Endpoint:** `{JIRA_BASE_URL}/rest/api/3/issue/{ticket_id}`
- **ADF Parsing:** Critical - descriptions are nested JSON, not plain text
- **Fields to extract:** summary, description, issuetype, status, priority, labels, components, comments, issuelinks, subtasks, attachments, customfield_10016 (acceptance criteria)

### Groq API
- **Models:** llama-3.3-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it, llama-3.1-8b-instant
- **Streaming:** Supported via `stream=True`
- **Rate Limits:** Must implement exponential backoff

### Ollama API
- **Endpoint:** `http://localhost:11434`
- **List Models:** `GET /api/tags`
- **Generate:** `POST /api/generate` with `stream=true`

---

## Constraints Identified

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| Context window limits | Large JIRA tickets may exceed LLM context | Truncate comments first, then linked issues |
| ADF complexity | JIRA descriptions are nested JSON | Implement robust ADF to markdown converter |
| PDF parsing variability | Font sizes, layouts differ | Fallback to raw text if parsing fails |
| CORS in development | Frontend (:5173) vs Backend (:8000) | Configure FastAPI CORS middleware |
| API key security | Keys must not leak to frontend | All API calls go through backend |
| SQLite auto-create | DB must exist on first run | Use `create_all()` at startup |

---

## Error Scenarios & Messages

| Scenario | User Message |
|----------|--------------|
| JIRA 401 | "JIRA authentication failed. Check your email and API token in Settings" |
| JIRA 404 | "Ticket {ID} not found. Verify the ticket ID and your project access" |
| JIRA connection refused | "Cannot reach JIRA server. Check the URL in Settings" |
| Groq auth failure | "Groq API key is invalid. Update it in Settings" |
| Groq rate limit | "Groq rate limit hit. Retrying in {n} seconds..." |
| Ollama not running | "Cannot connect to Ollama. Make sure it's running: `ollama serve`" |
| Ollama model not found | "Model {name} not found. Pull it first: `ollama pull {name}`" |
| Template PDF not found | "testplan.pdf not found. Add it to the project root or update path in Settings" |
| Template PDF parsing failure | "Could not parse template structure. Using raw text instead" |

---

## Technical Constraints

| Constraint | Impact | Workaround |
|------------|--------|------------|
| *TBD* | *TBD* | *TBD* |

---

## Integration Notes

### External Services

| Service | Status | Notes |
|---------|--------|-------|
| *TBD* | *Pending* | *TBD* |

---

## Learnings & Insights

### Key Insights

*None yet.*

### Edge Cases Discovered

*None yet.*

---

## Last Updated

- **Date:** 2026-02-15
- **Phase:** 0 - Initialization
