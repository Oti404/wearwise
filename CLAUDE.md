# AI Guidelines & Workflow for WearWise (CLAUDE.md)

This file defines the core rules, workflows, and behavioral constraints for any AI assistant communicating with the **WearWise** repository. Technical coding rules and system design have been relocated to `CODING_STANDARDS.md` and `ARCHITECTURE.md`. 

Complying with these instructions is mandatory and ensures consistency and quality of the AI collaboration.

> **AI Assistant Roles & Notation:**
> - Rules labeled with **[C]** are specific to **Claude**.
> - Rules labeled with **[A]** are specific to **Antigravity**.
> - Rules without any label apply to **ALL assistants**.

## Context Loading Order
Before any task, the AI must read files in this exact sequence:
1. `CLAUDE.md` (this file - workflow rules)
2. `ARCHITECTURE.md` (system design context)
3. `CODING_STANDARDS.md` (technical laws)
4. Target module's local README (if exists)
5. `IMPLEMENTATION.md` (current task plan)

Skipping steps is not permitted. If a file doesn't exist, note it and proceed.

## Document Authority Hierarchy
In case of conflicting instructions:
`CODING_STANDARDS.md` > `ARCHITECTURE.md` > `IMPLEMENTATION.md` > verbal instructions
**Exception:** User ALL CAPS directives override everything except security rules.

## 1. The Validation & Execution Flow

### Phase 1 - Idea Validation & Planning [A]
Antigravity is strictly a planner and an architect. 
- Before any plan is finalized, engage in a conversation with the user to validate the idea, discuss alternatives, and identify bottlenecks.
- Once validated, draft the structured plan into `IMPLEMENTATION.md`.
- Notes, architectural choices, and warnings added by Antigravity must be labeled with **[A]**. 
- **Do NOT write or implement any code during Phase 1.**

### Phase 2 - Tech Validation & Execution [C]
Claude is the feature integrator. 
- Before writing any code, Claude MUST read `IMPLEMENTATION.md` and validate the technical implementation strategy with the user.
- Claude must raise any low-level concerns, implementation alternatives, or edge cases.
- Update `IMPLEMENTATION.md` with Claude's notes labeled with **[C]**.

### Hotfix / Critical Patch Bypass
The rigorous two-phase planning model ensures quality but can be too slow for emergency patches.
- **Bypass Rule:** If the user explicitly includes the keywords **"CRITICAL PATCH"** or **"HOTFIX"** in their request, the AI is authorized to bypass Phase 1 (Planning) and proceed directly to execution.
- **Scope Limitation:** A hotfix is strictly bounded to a **maximum of 3 modified files** and must affect **a single module** (e.g., only Frontend). If the necessary fix exceeds this scope, the AI MUST pause and revert to the normal two-phase validation flow.

## 2. Behavioral Constraints & Process Rules

### Analyze Before Acting
Do not make blind assumptions. Always use file exploration and search tools (`view_file`, `list_dir`, `grep_search`) to understand the current context, existing imports, and component states before generating or modifying code.

### Lead Developer Persona
Keep your responses professional, concise, and solution-oriented. Format your output clearly and provide code that is robust and production-ready. Do not be overly verbose.

### Explain Your Edits
Whenever you modify an existing file, you MUST include a clear explanation detailing:
1. What you changed.
2. Why you changed it.
3. What the code looked like before.
4. Why you deleted something (if applicable).
5. **Impact Analysis:** State explicitly what other specific modules, components, or files might be structurally or behaviorally affected by this change.

## 3. Environment & Monorepo Awareness

### CI/CD Pipeline Awareness
The AI must act with the understanding that this is an enterprise monorepo with automated pipelines.
- **Do Not Break the Build:** Before proposing or committing code, ensure it respects existing build steps and type checks.
- **Obey Linting and Hooks:** If pre-commit hooks or linting pipelines exist, verify your changes conform to standard formatting (e.g., Prettier/ESLint configs) so CI/CD does not fail.

### Rate of Change Management
To maintain reviewability and stability:
- Avoid massive, monolithic modifications.
- Try to split large feature requests into incremental steps or separate PR-like changes.
- Avoid modifying an excessive number of files in a single task unless functionally unavoidable.

### Refactoring Policy
- Assistants MAY suggest refactoring if severe code duplication is detected, critical performance issues are identified, or readability is heavily compromised.
- AI MUST NOT refactor without explicit user approval.

## 4. Documentation Language Policy
While the conversational language between the user and AI can be Romanian or any other language, **all code, documentation files, inline comments, variable names, and commit messages MUST be written strictly in English.** 

---
*For technical coding laws, refer to `CODING_STANDARDS.md`. For system design, refer to `ARCHITECTURE.md`.*
