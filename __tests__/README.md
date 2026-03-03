# Testing Documentation

This document provides comprehensive information about the testing setup for the DoctorPost v12 application.

## Test Structure

The testing suite is organized into several categories:

### 1. Unit Tests (`__tests__/`)
- **Components**: Tests for React components in `__tests__/components/`
- **API**: Integration tests for API endpoints in `__tests__/api/`
- **Lib**: Tests for utility libraries and services in `__tests__/lib/`
- **Performance**: Performance and load tests in `__tests__/performance/`
- **Utils**: Shared test utilities and mock data generators

### 2. End-to-End Tests (`e2e/`)
- **User Workflows**: Complete user journey tests
- **Authentication Flow**: Login/logout functionality
- **Content Factory**: Full content creation workflow
- **Cross-browser Testing**: Tests across multiple browsers

### 3. CI/CD Pipeline (`.github/workflows/`)
- **Automated Testing**: Runs on every push and PR
- **Multi-environment**: Tests across different Node.js versions
- **Performance Monitoring**: Tracks performance metrics
- **Security Scanning**: Automated security checks

## Test Commands

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Run performance tests
npm run test:performance

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Validate test coverage
npm run test:validate

# Run all tests (unit + integration + E2E)
npm run test:all
```

### Code Quality

```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run security audit
npm run security:check
```

## Test Coverage

### Features Covered

1. **Authentication System**
   - Login/logout flows
   - Session management
   - Protected route access

2. **Content Factory Pipeline**
   - Topic proposal and research
   - Content generation and formatting
   - Post scheduling and management

3. **Calendar Management**
   - Post scheduling visualization
   - Date selection and navigation
   - Post editing workflows

4. **Knowledge Base**
   - Document management
   - Import/export functionality
   - Version history tracking

5. **Campaign Management**
   - Campaign creation and tracking
   - Batch processing
   - Progress monitoring

6. **API Endpoints**
   - Authentication middleware
   - Data validation
   - Error handling

7. **AI Services**
   - Multiple AI provider integration
   - Request/response handling
   - Error recovery

8. **Performance & Load**
   - Response time validation
   - Memory leak detection
   - Concurrent request handling
   - Large payload processing

## Test Utilities

### Mock Data Generators

The `testUtils.ts` file provides mock data generators for all major entities:

```typescript
import { createMockBrandProfile, createMockScheduledPost } from '../utils/testUtils';

const mockProfile = createMockBrandProfile({
  companyName: 'Test Company',
  industry: 'Technology'
});

const mockPost = createMockScheduledPost({
  title: 'Test Post',
  status: 'scheduled'
});
```

### Common Mocks

- **Fetch API**: Mock global fetch for API testing
- **LocalStorage**: Mock browser storage
- **Session Storage**: Mock session storage
- **Router**: Mock Next.js router functions

### Custom Render Function

A custom render function is provided that includes necessary providers:

```typescript
import { render } from '../utils/testUtils';

render(<MyComponent />, { /* options */ });
```

## Writing Tests

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### API Tests

```typescript
import request from 'supertest';

describe('API Endpoints', () => {
  it('should return 200 for valid request', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can complete workflow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Performance Testing

### Response Time Validation

API endpoints are tested for response times:
- Health checks: < 100ms
- AI requests: < 30 seconds
- Knowledge queries: < 2 seconds

### Memory Leak Detection

Content generation processes are monitored for memory leaks over multiple iterations.

### Concurrent Request Handling

The system is tested with multiple concurrent requests to ensure stability.

### Large Payload Processing

Tests verify that large documents and content can be processed efficiently.

## CI/CD Integration

### Automated Testing

Every push and pull request triggers:
- Unit tests across multiple Node.js versions
- Integration tests
- E2E tests
- Performance tests
- Security scans

### Build Validation

- TypeScript compilation
- Linting rules
- Test coverage thresholds
- Security vulnerability checks

### Deployment Gates

Tests must pass before deployment to:
- Development environment
- Staging environment
- Production environment

## Test Data Management

### Seed Data

Test data is managed through:
- Mock data generators
- Test fixtures
- Database seeding scripts

### Data Isolation

Each test runs with isolated data to prevent:
- Test interference
- Data corruption
- Flaky tests

## Best Practices

### Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent

### Mocking Strategy

- Mock external dependencies
- Use real implementations for unit tests
- Mock only what's necessary
- Clean up mocks between tests

### Performance Considerations

- Use appropriate timeouts
- Avoid unnecessary async operations
- Clean up resources
- Use parallel test execution

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**
   - Check environment variables
   - Verify Node.js version compatibility
   - Review timing issues

2. **E2E tests timing out**
   - Increase timeout values
   - Check network connectivity
   - Verify application state

3. **Performance tests inconsistent**
   - Run on consistent hardware
   - Close background applications
   - Use dedicated test environment

### Debugging

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- path/to/test.ts

# Run tests in debug mode
npm test -- --debug
```

## Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Follow existing patterns**
3. **Update test coverage validation**
4. **Run all test suites**
5. **Document new test cases**

For more information, see the [implementation plan](../docs/plans/2026-03-01-content-factory-pipeline.md).