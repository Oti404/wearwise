# WearWise Coding Standards (CODING_STANDARDS.md)

This document defines the strict technical laws and coding conventions for the WearWise monorepo. It covers frontend, backend, database rules, testing, and deployment processes adapted specifically to our React Native & Express stack.

## 1. Frontend Conventions
- **State Management**: Use **Zustand** for global client-side state mapping UI intent.
- **Styling Policy (MVP Phase)**: The current development focus is on speed and building a functional Minimum Viable Product (MVP). Styling must be kept rapid, lean, and purely functional using standard React Native **`StyleSheet`** objects. Functional state matters more than aesthetics right now.
- **Routing**: Leverage **Expo Router** which enforces standard file-based routing mechanisms built directly inside the `/app` folder.
- **Error Handling**: Use React Error Boundaries globally and around major features. Never let the entire native application force-close due to one anomalous component.

## 2. Backend Conventions
- **Architecture**: Strictly adhere to the MVC/Service-driven architecture: `Route -> Controller (validation) -> Service (business logic) -> DB Interaction`.
- **Pagination**: Prefer **cursor-based pagination** over offset pagination for standardizing mobile-optimized list endpoints and infinitely scrolling views.
- **Caching**: The backend utilizes lightweight in-memory caching solutions or relies heavily upon efficient Drizzle queries.
- **Resilience**: Database modifications must use Transactions to guarantee ACID compliance.

*(Note: Security configurations like Token Lifetimes, JSON Error Contracts, and explicit RBAC strategies are currently pending initial implementation. Refer to `TODO.md`)*

## 3. Performance Budgets
- **Mobile Load**: Strict optimizations apply natively. Reduce overall asset sizes sent through Expo bundles to ensure fast OTA updates.
- **API Response Target**: Standard endpoints must achieve a response time of `p95 < 500ms`. AI-enriched endpoints must target `p95 < 2s`.
- **Database Efficiency**: N+1 query patterns must be actively detected and eliminated utilizing batch loaders or native ORM wrapper relations.

## 4. Code Comments Policy
- **Explain Intent**: Comments must explain *why* the code exists, not *what* the code is doing.
- **No Dead Code**: Commented-out dead code is strictly forbidden in main branches. Test your code, then delete garbage.
- **TODO References**: All `TODO` comments must include a ticket reference or GitHub issue tracking number.

## 5. Environment & Dependency Rules
- **Environment Variables**: Never hardcode secrets. Whenever a new variable is introduced, it must be duplicated as a blank entity inside `.env.example`.
- **Dependency Management**: Adding external packages requires explicit justification, a bundle size assessment, and verification of non-restrictive licenses.

## 6. Database Rules (Drizzle ORM)
- **Tooling**: All PostgreSQL interactions MUST utilize **Drizzle ORM**. Write schema-first definitions.
- **Auditing**: All tables must include audit columns: `created_at`, `updated_at`, and `deleted_at`.
- **Data Deletion**: Strictly enforce a **Soft Delete** convention. Records should set `deleted_at` instead of hard deleting rows.
- **Migrations**: Migrations must follow strict sequential naming/ordering, and both `up` and `down` logic must be tested.

## 7. Logging & Observability
- **Structured Logging**: Use organized logging strings containing explicit tags and log levels (`info`, `warn`, `error`).
- **Tracing**: Attach **Correlation IDs** to track requests seamlessly through the entire backend stack when possible structure allows it.

## 8. Git & Branching Strategy
- **Branch Naming**: Enforce standard branch names: `feat/`, `fix/`, `chore/`, and `hotfix/`.
- **Commit Messages**: Strictly follow **Conventional Commits** (e.g., `feat: build login component`).
- **Merge Strategy**: Use **Squash and Merge** for clean commit histories.

## 9. Testing Policy
- **Coverage Master Policy**: As the project grows, test coverage serves as an aspirational target. Current environment test baseline acts at `0%`. New critical logic pipelines should inherently arrive with integration checks.
- **Coverage Exceptions**: External generated files, configuration files (`*.config.js`), Typescript `.d.ts` type definitions, and explicitly tagged `seed scripts` do not demand tests.
- **Location Rules**: When initiated, unit tests are absolutely mandatory for all internal Services and controllers. 
- **Naming Conventions**: Strict consistency will be required. Test files should read naturally: `describe('ServiceName') -> it('should [expected behavior] when [condition]')`.

## Definition of Done
- [ ] Code complies and runs smoothly inside the Expo Go module.
- [ ] UI remains accessible and strictly adheres to standard touch-sizing.
- [ ] Related API documentation is fully updated.
- [ ] Code review approval received.
