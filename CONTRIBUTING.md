# Contributing to URL Shortener Service

Thank you for considering contributing to the URL Shortener Service! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/url-shorter.git
   cd url-shorter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run tests to ensure everything works**
   ```bash
   npm test
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments where necessary
   - Update types as needed

3. **Add tests**
   - Write unit tests for new functions
   - Add integration tests for new endpoints
   - Maintain 80%+ code coverage
   - Run `npm run test:coverage` to check

4. **Update documentation**
   - Update README.md if needed
   - Update API.md for API changes
   - Add comments to complex code
   - Update CHANGELOG if applicable

### Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **Naming**: Use camelCase for variables/functions, PascalCase for classes
- **Comments**: Use JSDoc comments for functions and classes
- **Formatting**: Code is formatted automatically (consider adding Prettier)
- **Error Handling**: Use descriptive error messages

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Build and verify
npm run build
```

**Test Requirements:**
- All new features must have tests
- Bug fixes should include regression tests
- Maintain minimum 80% coverage
- Tests should be clear and descriptive

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add custom short code validation
fix: handle edge case in URL validation
docs: update API documentation
test: add tests for rate limiter
refactor: simplify error handling logic
```

Prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

### Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests and build**
   ```bash
   npm test
   npm run build
   ```

3. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request**
   - Use a clear title and description
   - Reference any related issues
   - Include screenshots if UI changes
   - Describe testing performed

5. **Code Review**
   - Address review feedback
   - Keep the PR focused and small
   - Be responsive to comments

## Project Structure

```
src/
├── __tests__/           # Integration tests
├── middleware/          # Express middleware
│   ├── errorHandler.ts  # Error handling
│   └── rateLimiter.ts   # Rate limiting
├── routes/              # API routes
│   └── urlRoutes.ts     # URL endpoints
├── services/            # Business logic
│   └── UrlShortenerService.ts
├── types/               # TypeScript types
│   └── index.ts
├── utils/               # Utilities
│   ├── config.ts        # Configuration
│   ├── logger.ts        # Logging
│   └── validator.ts     # Validation
├── app.ts               # Express setup
└── index.ts             # Entry point
```

## Adding New Features

### Adding a New Endpoint

1. Define types in `src/types/index.ts`
2. Add business logic to relevant service
3. Create route handler in `src/routes/`
4. Register route in `src/app.ts`
5. Add tests in `src/__tests__/`
6. Update API.md documentation

### Adding a Feature Flag

1. Add environment variable to `.env.example`
2. Add to config in `src/utils/config.ts`
3. Implement feature logic
4. Add conditional check for feature flag
5. Update README.md with feature details
6. Add tests with flag enabled/disabled

## Testing Guidelines

### Unit Tests

- Test individual functions in isolation
- Mock external dependencies
- Test edge cases and error conditions
- Use descriptive test names

Example:
```typescript
describe('isValidUrl', () => {
  it('should validate correct HTTP URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });
});
```

### Integration Tests

- Test complete API flows
- Test error handling
- Test feature flag behavior
- Use supertest for API testing

Example:
```typescript
describe('POST /api/shorten', () => {
  it('should create a short URL', async () => {
    const response = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(201);
    expect(response.body.shortCode).toBeDefined();
  });
});
```

## Reporting Issues

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS)
- Error messages/stack traces
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case / why it's needed
- Proposed implementation (optional)
- Examples of similar features

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the code, not the person

## Questions?

- Open an issue for questions
- Check existing issues first
- Be clear and concise

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

---

Thank you for contributing! 🎉
