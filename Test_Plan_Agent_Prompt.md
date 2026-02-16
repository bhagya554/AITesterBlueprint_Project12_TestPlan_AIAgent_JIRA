# Prompt: Build an Intelligent Test Plan Generator Agent — Full-Stack Web Application

## Overview

Build a **production-grade, locally-hosted web application** called **"TestPlan Agent"** that automatically generates comprehensive test plans by pulling context from JIRA tickets and filling a user-provided test plan template using an LLM.

The application must have a **clean, modern UI** (not a script or CLI tool), run entirely on the user's local machine, and be launchable with a single command.

---

## Tech Stack (Mandatory)

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| **Backend**  | Python 3.10+ with **FastAPI**                                           |
| **Frontend** | **React 18** (Vite) with Tailwind CSS, served by the backend in prod    |
| **Database** | **SQLite** (via SQLAlchemy) for history & settings persistence          |
| **PDF Parse**| **pdfplumber** (for extracting template structure from `testplan.pdf`)   |
| **PDF Gen**  | **ReportLab** or **WeasyPrint** (for exporting generated plans as PDF)  |
| **DOCX Gen** | **python-docx** (for exporting generated plans as DOCX)                 |
| **LLM**      | **Groq SDK** (`groq` Python package) AND **Ollama** (`ollama` package)  |
| **Config**   | `.env` file via `python-dotenv`                                         |

---

## Application Pages & UI Design

### Page 1 — Home / Generator (Main Page)

This is the primary workspace. Layout (top to bottom):

1.  **Header Bar**
    - App logo/name "TestPlan Agent" on the left
    - Navigation links: **Generator** | **History** | **Settings**
    - LLM status indicator (green dot = connected, red = error) on the right

2.  **Configuration Strip** (horizontal bar below header)
    - **LLM Provider toggle**: Radio buttons or segmented control → `Groq` | `Ollama`
    - If Groq selected → show model dropdown (e.g., `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `gemma2-9b-it`)
    - If Ollama selected → show model dropdown auto-populated by calling `GET http://localhost:11434/api/tags` to list locally available models
    - **Connection test button** ("Test LLM Connection") that makes a simple ping/completion call and shows ✅ or ❌

3.  **Input Section**
    - Large input field labeled **"JIRA Ticket ID"** with placeholder text `e.g., VMO-1`
    - Below it, a small read-only badge showing the currently configured JIRA base URL (pulled from settings)
    - **"Fetch & Generate"** primary button (prominent, colored)
    - **"Fetch Only"** secondary button (outline style — fetches JIRA data and displays it without generating yet, so user can review context before generation)

4.  **Context Preview Panel** (collapsible, appears after fetch)
    - Shows extracted JIRA data in a structured card:
      - **Title**, **Status**, **Type**, **Priority**
      - **Description** (rendered markdown)
      - **Acceptance Criteria**
      - **Comments** (last 10, collapsed by default)
      - **Linked Issues** (list with IDs and summaries)
      - **Attachments** (names only)
    - User can **edit/append** additional context in a text area labeled "Additional Context (optional)" before generating

5.  **Generation Output Panel**
    - While generating: show a **streaming text output** area with a typing indicator, the test plan appears progressively (use Server-Sent Events)
    - After generation completes:
      - Rendered output in a clean, formatted document-style view (with headings, tables, bullet points properly styled)
      - **Action buttons row**:
        - 📋 **Copy to Clipboard** (copies markdown)
        - 📄 **Download as PDF**
        - 📝 **Download as DOCX**
        - 🔄 **Regenerate** (re-runs with same context)
        - 💾 **Save to History**

---

### Page 2 — History

- Table/list of previously generated test plans with columns:
  - JIRA ID | Ticket Title | LLM Used | Model | Generated Date | Actions
- Actions: **View** (opens in a modal or detail page), **Download PDF**, **Download DOCX**, **Delete**
- Search/filter bar at the top
- Data stored in local SQLite database

---

### Page 3 — Settings

Organized in clearly labeled sections with cards:

**JIRA Configuration**
- JIRA Base URL (e.g., `https://mycompany.atlassian.net`)
- JIRA User Email
- JIRA API Token
- **"Test JIRA Connection"** button → makes a `/rest/api/3/myself` call, shows ✅ with user display name or ❌ with error

**Groq Configuration**
- Groq API Key (masked password field with show/hide toggle)
- Preferred Model (dropdown)
- **"Test Groq Connection"** button

**Ollama Configuration**
- Ollama Base URL (default: `http://localhost:11434`)
- **"Test Ollama Connection"** button → fetches available models and displays them
- Preferred Model (dropdown, populated after successful connection test)

**Template Configuration**
- Show current template file path (default: `../testplan.pdf` relative to project root)
- **"Browse / Change"** button to select a different PDF template
- **"Preview Template Structure"** button → extracts and displays the parsed section headings from the PDF so the user can verify parsing is correct

**General**
- Temperature slider (0.0 – 1.0, default 0.3)
- Max tokens slider (1000 – 8000, default 4096)

All settings saved to `.env` file AND SQLite (so they persist across restarts). The "Save Settings" button must write to both.

---

## Backend Architecture — Detailed Specifications

### Project Structure

```
testplan-agent/
├── backend/
│   ├── main.py                  # FastAPI app entry point, CORS, static file serving
│   ├── config.py                # Settings management (.env read/write)
│   ├── database.py              # SQLAlchemy models & session (SQLite)
│   ├── routers/
│   │   ├── jira.py              # /api/jira/* endpoints
│   │   ├── generator.py         # /api/generate/* endpoints (SSE streaming)
│   │   ├── history.py           # /api/history/* CRUD endpoints
│   │   ├── settings.py          # /api/settings/* endpoints
│   │   └── llm.py               # /api/llm/* endpoints (test connections, list models)
│   ├── services/
│   │   ├── jira_client.py       # JIRA REST API integration
│   │   ├── template_parser.py   # PDF template extraction logic
│   │   ├── llm_provider.py      # Abstraction layer over Groq & Ollama
│   │   ├── prompt_builder.py    # Constructs the LLM prompt from context + template
│   │   └── export_service.py    # PDF and DOCX generation from output
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Generator.jsx
│   │   │   ├── History.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── JiraPreview.jsx
│   │   │   ├── StreamOutput.jsx
│   │   │   ├── LLMSelector.jsx
│   │   │   └── ExportButtons.jsx
│   │   └── api/
│   │       └── client.js        # Axios/fetch wrappers for backend API
│   ├── package.json
│   └── vite.config.js
├── .env                          # All secrets and configuration
├── testplan.pdf                  # Default template location (or ../testplan.pdf)
├── start.sh                      # Single-command launcher (installs deps + starts both servers)
├── start.bat                     # Windows equivalent
└── README.md                     # Setup instructions
```

### API Endpoints

| Method | Endpoint                        | Description                                           |
| ------ | ------------------------------- | ----------------------------------------------------- |
| GET    | `/api/jira/ticket/{id}`         | Fetch and parse a JIRA ticket by ID                   |
| GET    | `/api/jira/test-connection`     | Test JIRA credentials                                 |
| POST   | `/api/generate/stream`          | SSE endpoint — streams generated test plan             |
| POST   | `/api/generate/export/pdf`      | Generate and return test plan as PDF file              |
| POST   | `/api/generate/export/docx`     | Generate and return test plan as DOCX file             |
| GET    | `/api/llm/providers`            | List available providers and their status              |
| GET    | `/api/llm/models/{provider}`    | List models for a provider (Groq=hardcoded, Ollama=dynamic) |
| POST   | `/api/llm/test`                 | Test LLM connection with a simple prompt               |
| GET    | `/api/history`                  | List all saved test plans                              |
| GET    | `/api/history/{id}`             | Get a specific saved test plan                         |
| DELETE | `/api/history/{id}`             | Delete a saved test plan                               |
| GET    | `/api/settings`                 | Get current settings (keys masked)                     |
| PUT    | `/api/settings`                 | Update settings                                        |
| GET    | `/api/template/preview`         | Parse and return template structure                    |

---

### JIRA Client (`jira_client.py`) — Detailed Logic

```python
# Connection: Use requests library with Basic Auth
# Auth: base64(email:api_token) in Authorization header
# Base endpoint: {JIRA_BASE_URL}/rest/api/3/issue/{ticket_id}
#
# Fields to extract:
#   - fields.summary → Title
#   - fields.description → Description (Atlassian Document Format → convert to plain text)
#   - fields.issuetype.name → Issue Type
#   - fields.status.name → Status
#   - fields.priority.name → Priority
#   - fields.labels → Labels
#   - fields.components → Components
#   - fields.comment.comments → Comments (extract body text, author, created date)
#   - fields.issuelinks → Linked Issues (extract type, inward/outward issue key + summary)
#   - fields.subtasks → Subtasks (key + summary + status)
#   - fields.attachment → Attachments (filename, mimeType — do NOT download)
#   - fields.customfield_* → Acceptance Criteria (commonly customfield_10016 for Jira Cloud)
#     ↳ If not found in custom field, parse from description looking for "Acceptance Criteria" heading
#
# IMPORTANT: Handle Atlassian Document Format (ADF) → convert the nested JSON structure to readable plain text
# IMPORTANT: Handle both Jira Cloud and Jira Server API differences gracefully
```

---

### Template Parser (`template_parser.py`) — Detailed Logic

```python
# Use pdfplumber to open testplan.pdf
# Extract all text from all pages
# Identify section headings by analyzing:
#   - Font size changes (larger = heading)
#   - Bold text patterns
#   - Numbering patterns (1., 1.1, 2., etc.)
#   - Common test plan sections: Introduction, Scope, Test Strategy, Test Cases,
#     Entry/Exit Criteria, Risk Assessment, Schedule, Deliverables, etc.
#
# Output: A structured dict like:
# {
#   "sections": [
#     {"number": "1", "title": "Introduction", "subsections": [...]},
#     {"number": "2", "title": "Scope", "subsections": [...]},
#     ...
#   ],
#   "raw_text": "full extracted text for additional context"
# }
#
# If PDF parsing fails or produces poor results, fall back to using the raw text
# and letting the LLM interpret the structure.
```

---

### LLM Provider (`llm_provider.py`) — Detailed Logic

```python
# Abstract base interface:
# class LLMProvider:
#     async def generate_stream(prompt: str, model: str, temperature: float, max_tokens: int) → AsyncGenerator[str]
#     async def test_connection() → bool
#     async def list_models() → List[str]
#
# GroqProvider:
#   - Uses `groq` Python SDK
#   - Streaming via client.chat.completions.create(stream=True)
#   - Models: llama-3.3-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it, llama-3.1-8b-instant
#   - Error handling: rate limits (retry with exponential backoff), auth errors, model not found
#
# OllamaProvider:
#   - Uses `ollama` Python package or direct HTTP calls to localhost:11434
#   - Streaming via /api/generate endpoint with stream=true
#   - List models via /api/tags
#   - Error handling: connection refused (Ollama not running), model not pulled
#
# Factory function: get_provider(provider_name: str) → LLMProvider
```

---

### Prompt Builder (`prompt_builder.py`) — The Core Intelligence

This is the most critical component. Build the prompt as follows:

```
SYSTEM PROMPT:
You are an expert QA Engineer and Test Architect with 15+ years of experience. Your task is to
generate a comprehensive, detailed test plan based on the provided JIRA ticket context. You must
strictly follow the template structure provided.

Rules:
1. Fill EVERY section of the template with relevant, specific content derived from the JIRA context
2. Generate concrete, actionable test cases (not vague descriptions)
3. Include positive tests, negative tests, edge cases, and boundary conditions
4. Specify clear expected results for each test case
5. Identify risks specific to the described feature/change
6. Use professional QA terminology
7. If information for a section is not available from the JIRA context, state what assumptions you
   made and provide reasonable defaults
8. Format output in clean Markdown with proper headings matching the template structure

USER PROMPT:
## TEST PLAN TEMPLATE STRUCTURE
{extracted_template_sections_with_numbering}

## JIRA TICKET CONTEXT
- **Ticket ID**: {jira_id}
- **Title**: {summary}
- **Type**: {issue_type}
- **Priority**: {priority}
- **Status**: {status}
- **Labels**: {labels}
- **Components**: {components}

### Description
{description}

### Acceptance Criteria
{acceptance_criteria}

### Comments (Recent)
{formatted_comments}

### Linked Issues
{linked_issues_with_summaries}

### Subtasks
{subtasks_with_statuses}

{additional_user_context if provided}

---
Generate the complete test plan now, following the template structure exactly.
```

---

### Export Service (`export_service.py`)

- **PDF Export**: Use ReportLab or WeasyPrint to convert the markdown output to a professionally formatted PDF with:
  - Header with "Test Plan — {JIRA_ID}" and generation date
  - Table of contents
  - Proper heading styles, tables, bullet points
  - Footer with page numbers

- **DOCX Export**: Use python-docx to create a Word document with:
  - Title page with JIRA ID, title, date, "Generated by TestPlan Agent"
  - Heading styles (Heading 1, 2, 3) matching template sections
  - Tables for test cases
  - Proper formatting

---

## Streaming Implementation

The generation endpoint MUST use **Server-Sent Events (SSE)** for real-time streaming:

**Backend** (`generator.py`):
```python
@router.post("/api/generate/stream")
async def generate_stream(request: GenerateRequest):
    async def event_generator():
        yield f"data: {json.dumps({'type': 'status', 'message': 'Fetching JIRA ticket...'})}\n\n"
        # ... fetch JIRA ...
        yield f"data: {json.dumps({'type': 'status', 'message': 'Parsing template...'})}\n\n"
        # ... parse template ...
        yield f"data: {json.dumps({'type': 'status', 'message': 'Generating test plan...'})}\n\n"
        async for chunk in llm_provider.generate_stream(prompt):
            yield f"data: {json.dumps({'type': 'content', 'text': chunk})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Frontend** (`StreamOutput.jsx`):
```javascript
// Use EventSource or fetch with ReadableStream to consume SSE
// Append each 'content' chunk to state, render with markdown-to-jsx or react-markdown
// Show status messages in a progress indicator above the output
```

---

## Error Handling Requirements

Every error must be caught and displayed in the UI with a helpful message:

| Error Scenario                    | User-Facing Message                                                     |
| --------------------------------- | ----------------------------------------------------------------------- |
| JIRA auth failure (401)           | "JIRA authentication failed. Check your email and API token in Settings"|
| JIRA ticket not found (404)       | "Ticket {ID} not found. Verify the ticket ID and your project access"   |
| JIRA connection refused           | "Cannot reach JIRA server. Check the URL in Settings"                   |
| Groq auth failure                 | "Groq API key is invalid. Update it in Settings"                        |
| Groq rate limit                   | "Groq rate limit hit. Retrying in {n} seconds..."                       |
| Ollama not running                | "Cannot connect to Ollama. Make sure it's running: `ollama serve`"      |
| Ollama model not found            | "Model {name} not found. Pull it first: `ollama pull {name}`"           |
| Template PDF not found            | "testplan.pdf not found. Add it to the project root or update path in Settings" |
| Template PDF parsing failure      | "Could not parse template structure. Using raw text instead"            |

---

## Single-Command Startup

Create `start.sh` (Linux/Mac) and `start.bat` (Windows):

```bash
#!/bin/bash
# start.sh
echo "🚀 Starting TestPlan Agent..."

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies & build
cd ../frontend
npm install
npm run build

# Copy build to backend static folder
cp -r dist ../backend/static

# Start the server
cd ../backend
echo "✅ Open http://localhost:8000 in your browser"
uvicorn main:app --host 0.0.0.0 --port 8000
```

In production mode, FastAPI serves the React build as static files. In development mode, provide a `start-dev.sh` that runs both servers with hot reload.

---

## `.env` File Structure

```env
# JIRA Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token

# Groq Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.1

# LLM Settings
DEFAULT_PROVIDER=groq
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=4096

# Template
TEMPLATE_PATH=../testplan.pdf
```

---

## UI Design Guidelines

- **Color scheme**: Professional — dark sidebar or top nav with a white/light content area. Use a primary accent color (e.g., indigo/blue) for CTAs.
- **Typography**: Clean sans-serif (Inter or system font stack)
- **The output panel** should look like a document preview (white card with shadow, proper typography hierarchy)
- **Loading states**: Use skeleton loaders for JIRA data fetch, pulsing animation for LLM generation
- **Toast notifications** for success/error messages (e.g., "Settings saved", "Copied to clipboard")
- **Responsive**: Should work well on screens 1024px and wider (no need for mobile optimization)
- **Dark mode**: Optional but appreciated

---

## README.md Must Include

1. Project title and one-line description
2. Screenshot/GIF of the running application
3. Prerequisites (Python 3.10+, Node.js 18+, Ollama if using local LLM)
4. Installation steps (clone → configure `.env` → run `start.sh`)
5. How to get a JIRA API token (link to Atlassian docs)
6. How to get a Groq API key (link to Groq console)
7. How to set up Ollama (install + pull a model)
8. Troubleshooting section for common errors

---

## Critical Implementation Notes

1. **NEVER expose API keys to the frontend** — all LLM and JIRA calls go through the backend
2. **JIRA ADF (Atlassian Document Format) parsing is critical** — description fields in Jira Cloud are NOT plain text, they are complex nested JSON. You MUST convert ADF to readable text
3. **Handle large JIRA tickets gracefully** — if the combined context exceeds the model's context window, truncate comments first, then linked issues, preserving the core description and acceptance criteria
4. **The template parser must be robust** — if it can't identify sections from PDF formatting, fall back to regex patterns for common numbering (1., 1.1, 2., a., etc.)
5. **SQLite DB must auto-create on first run** — use `create_all()` at startup
6. **CORS must be configured for local development** (frontend on port 5173, backend on port 8000)
