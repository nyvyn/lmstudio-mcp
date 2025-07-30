# AI Agent Guidelines

## Repository Standards

- Use Tailwind CSS for styling components. Prefer utility classes directly in JSX and inline `style` attributes when
  necessary. Avoid `.module.css` files.
- Place test files alongside the pages or components they cover (e.g. `components/Button.tsx` and
  `components/Button.test.tsx`).
- Create end-to-end tests in the `e2e/` directory using Playwright for web applications.
- Run `npm test` before committing to ensure all tests pass.

## Feature Specification Workflow

### File Structure

Create single spec file: `specs/{YYYYMMDD}-{FeatureName}.md`

### Specification Template

Use this structure for comprehensive feature specs:

```markdown
# Feature: {FeatureName}

## Requirements

### User Story

As a [role], I want [feature], so that [benefit].

### Acceptance Criteria (EARS Syntax)

- The system shall [always active requirement]
- While [condition], the system shall [conditional requirement]
- When [trigger], the system shall [event-driven requirement]
- If [error condition], then the system shall [error handling]

### Non-Functional Requirements

- Performance: [specific targets]
- Security: [security requirements]
- Accessibility: [compliance and ease of use]

## Design

### Architecture Overview

[High-level description with Mermaid diagrams]

### Components

| Component | Responsibility | Interfaces | Dependencies |
|-----------|---------------|------------|--------------|
| [Name]    | [Role]        | [APIs]     | [Libraries]  |

### Data Models

```mermaid
classDiagram
    [domain classes and relations]
```

### Error Handling

[Failure modes and recovery strategies]

## Test Scenarios

```gherkin
Feature: [Feature name] @smoke @regression

Scenario: [Happy path] @smoke
Given [initial context]
When [action]
Then [expected outcome]

Scenario: [Edge case] @regression
Given [edge condition]
When [action] 
Then [expected behavior]
```

## User Documentation

### Getting Started

1. [Prerequisites]
2. [Access method]
3. [Quick start steps]

### Workflows

#### [Primary Workflow]

1. [Step 1]
2. [Step 2]

### Troubleshooting

| Issue     | Cause        | Resolution  |
|-----------|--------------|-------------|
| [Problem] | [Root cause] | [Fix steps] |

## Implementation Tasks

- [ ] [Epic 1: Major component]
    - [ ] Create/modify [specific files]
    - [ ] Implement [specific functionality]
    - [ ] Add tests for [test scenarios]
- [ ] [Epic 2: Integration]
    - [ ] Connect [components]
    - [ ] Handle [error cases]

## Glossary

- (Term): [Definition]

```
