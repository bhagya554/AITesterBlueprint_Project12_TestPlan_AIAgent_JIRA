# B.L.A.S.T. Automation Framework

## Project Overview

This project defines the **B.L.A.S.T.** (Blueprint, Link, Architect, Stylize, Trigger) protocol - a deterministic framework for building self-healing automation systems using the **A.N.T.** 3-layer architecture. It is designed for use within the Antigravity platform.

**Core Philosophy:** Prioritize reliability over speed. Never guess at business logic.

---

## Architecture Overview

The B.L.A.S.T. protocol operates on a **3-layer architecture** that separates concerns to maximize reliability:

### Layer 1: Architecture (`architecture/`)
- Technical SOPs (Standard Operating Procedures) written in Markdown
- Defines goals, inputs, tool logic, and edge cases
- **Golden Rule:** If logic changes, update the SOP before updating the code

### Layer 2: Navigation (Decision Making)
- The reasoning layer that routes data between SOPs and Tools
- Orchestrates execution by calling tools in the correct order
- Does NOT perform complex tasks directly

### Layer 3: Tools (`tools/`)
- Deterministic Python scripts that are atomic and testable
- Environment variables/tokens stored in `.env`
- Uses `.tmp/` for all intermediate file operations

---

## Project File Structure

```
├── gemini.md          # Project Map & State Tracking (The "Constitution")
├── .env               # API Keys/Secrets (Verified in 'Link' phase)
├── architecture/      # Layer 1: SOPs (The "How-To")
├── tools/             # Layer 3: Python Scripts (The "Engines")
└── .tmp/              # Temporary Workbench (Intermediates - ephemeral)
```

### Planning Files (Memory)
- `task_plan.md` → Phases, goals, and checklists
- `findings.md` → Research, discoveries, constraints
- `progress.md` → What was done, errors, tests, results

### Project Constitution (`gemini.md`)
- Data schemas
- Behavioral rules
- Architectural invariants
- Maintenance log

**Important:** `gemini.md` is *law*. The planning files are *memory*.

---

## The B.L.A.S.T. Protocol Phases

### 🟢 Phase 0: Initialization (Mandatory)

Before any code is written or tools are built:

1. **Initialize Project Memory**
   - Create `task_plan.md`, `findings.md`, `progress.md`
   - Initialize `gemini.md` as the Project Constitution

2. **Halt Execution Condition**
   - Strictly forbidden from writing scripts in `tools/` until:
     - Discovery Questions are answered
     - The Data Schema is defined in `gemini.md`
     - `task_plan.md` has an approved Blueprint

### 🏗️ Phase 1: Blueprint (Vision & Logic)

**Discovery Questions (5 mandatory):**
1. **North Star:** What is the singular desired outcome?
2. **Integrations:** Which external services (Slack, Shopify, etc.) do we need? Are keys ready?
3. **Source of Truth:** Where does the primary data live?
4. **Delivery Payload:** How and where should the final result be delivered?
5. **Behavioral Rules:** How should the system "act"? (Tone, logic constraints, "Do Not" rules)

**Data-First Rule:** Define the **JSON Data Schema** (Input/Output shapes) in `gemini.md`. Coding only begins once the "Payload" shape is confirmed.

### ⚡ Phase 2: Link (Connectivity)

1. **Verification:** Test all API connections and `.env` credentials
2. **Handshake:** Build minimal scripts in `tools/` to verify external services respond correctly
3. Do not proceed to full logic if the "Link" is broken

### ⚙️ Phase 3: Architect (The 3-Layer Build)

Implement within the 3-layer architecture described above.

### ✨ Phase 4: Stylize (Refinement & UI)

1. **Payload Refinement:** Format outputs (Slack blocks, Notion layouts, Email HTML) for professional delivery
2. **UI/UX:** Apply clean CSS/HTML and intuitive layouts if dashboard/frontend exists
3. **Feedback:** Present stylized results for feedback before deployment

### 🛰️ Phase 5: Trigger (Deployment)

1. **Cloud Transfer:** Move finalized logic from local testing to production cloud environment
2. **Automation:** Set up execution triggers (Cron jobs, Webhooks, or Listeners)
3. **Documentation:** Finalize the **Maintenance Log** in `gemini.md`

---

## Operating Principles

### 1. The "Data-First" Rule

Before building any Tool:
- Define the **Data Schema** in `gemini.md`
- What does the raw input look like?
- What does the processed output look like?
- Coding only begins once the "Payload" shape is confirmed

**After any meaningful task:**
- Update `progress.md` with what happened and any errors
- Store discoveries in `findings.md`
- Only update `gemini.md` when:
  - A schema changes
  - A rule is added
  - Architecture is modified

### 2. Self-Annealing (The Repair Loop)

When a Tool fails or an error occurs:

1. **Analyze:** Read the stack trace and error message. Do not guess.
2. **Patch:** Fix the Python script in `tools/`.
3. **Test:** Verify the fix works.
4. **Update Architecture:** Update the corresponding `.md` file in `architecture/` with the new learning so the error never repeats.

### 3. Deliverables vs. Intermediates

- **Local (`.tmp/`):** All scraped data, logs, and temporary files. Ephemeral - can be deleted.
- **Global (Cloud):** The "Payload." Google Sheets, Databases, or UI updates.
- **A project is only "Complete" when the payload is in its final cloud destination.**

---

## Workflow Guidelines

### When Starting a New Project

1. Read this `AGENTS.md` file
2. Follow Protocol 0: Initialize Project Memory
3. Execute Phase 1: Blueprint - answer all 5 discovery questions
4. Define data schemas in `gemini.md`
5. Get user confirmation before proceeding to Phase 2

### When Modifying Existing Code

1. Check `gemini.md` for architectural invariants and data schemas
2. Review relevant SOPs in `architecture/`
3. Make minimal changes to achieve the goal
4. Update SOPs if logic changes (Golden Rule)
5. Update `progress.md` with changes and test results

### When Fixing Errors

1. Follow the Self-Annealing Repair Loop
2. Never guess - analyze actual error messages
3. Update architecture documentation with learnings

---

## Key Constraints

- **Never write scripts in `tools/` until:** Discovery Questions answered, Data Schema defined, and Blueprint approved
- **Never guess at business logic** - prioritize reliability over speed
- **Always update SOPs before code** when logic changes
- **Project is only "Complete"** when payload reaches final cloud destination
