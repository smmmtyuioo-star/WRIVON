---
name: architecture
description: Software architecture guidance — design patterns, project structure, dependency management, and system design for building maintainable applications.
---

# Architecture

Guidance for designing and evaluating software architecture.

## Project Structure

Organize by domain/feature, not by technical layer:

```
src/
  features/
    auth/
      auth.controller.ts
      auth.service.ts
      auth.test.ts
    users/
      users.controller.ts
      users.service.ts
      users.test.ts
  shared/
    middleware/
    utils/
    types/
```

## Design Patterns

| Pattern | When to use | Example |
|---------|-------------|---------|
| Factory | Creating objects with complex setup | DB connection, API client |
| Repository | Abstracting data access | UserRepository.findByEmail() |
| Service | Business logic layer | AuthService.login() |
| Middleware | Cross-cutting concerns | Logging, auth, rate limiting |
| Observer | Event-driven communication | EventEmitter, pub/sub |
| Strategy | Swappable algorithms | Payment gateways, auth providers |
| Adapter | Wrapping external dependencies | StripeAdapter, S3Adapter |

## Principles

- **SOLID**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY**: Don't repeat yourself — extract shared logic
- **KISS**: Keep it simple — prefer the simplest solution
- **YAGNI**: You aren't gonna need it — don't add unused abstractions
- **Separation of concerns**: Each module has one job

## Dependencies

- Minimize external dependencies — own your infrastructure
- Depend on abstractions, not implementations
- Use dependency injection for testability
- Wrap third-party libraries in adapters

## Error Handling

- Use typed errors (custom error classes)
- Handle errors at the boundary (controller/route level)
- Don't swallow errors silently
- Log enough context to debug (include request ID, input, stack)
- Fail fast — validate inputs early

## API Design

- RESTful: resources, HTTP methods, status codes
- Consistent naming: `/api/v1/resource/:id`
- Pagination: `?page=1&limit=20` with total count
- Error format: `{ error: { code, message, details } }`
- Version your API from day one
