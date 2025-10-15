# Testing Guide

This document provides a comprehensive guide for testing the Ari Chatbot frontend application.

## Overview

The testing setup includes:
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Component integration with mocked APIs
- **End-to-End Tests**: Playwright for full user workflows
- **API Mocking**: MSW (Mock Service Worker) for realistic API responses

## Test Structure

```
src/
├── __tests__/
│   ├── utils/
│   │   └── test-utils.jsx          # Testing utilities and helpers
│   ├── mocks/
│   │   ├── handlers.js             # MSW API handlers
│   │   └── server.js               # MSW server setup
│   └── components/
│       ├── ui/
│       │   └── __tests__/          # UI component tests
│       ├── chat/
│       │   └── __tests__/          # Chat component tests
│       └── ...
├── context/
│   └── __tests__/                  # Context provider tests
├── integrations/
│   └── __tests__/                  # Custom hook tests
├── utils/
│   └── __tests__/                  # Utility function tests
└── pages/
    ├── __tests__/                  # Page integration tests
    └── auth/
        └── __tests__/              # Auth page tests

e2e/                                # End-to-end tests
├── auth.spec.js                    # Authentication flow tests
└── chat.spec.js                    # Chat interface tests
```

## Running Tests

### Unit Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test categories
npm run test:components    # UI components
npm run test:pages        # Page components
npm run test:utils        # Utility functions
npm run test:hooks        # Custom hooks
npm run test:context      # Context providers
npm run test:integration  # Integration tests

# Run tests for CI
npm run test:ci
```

### End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run all tests (unit + E2E)
npm run test:all
```

## Test Categories

### 1. Unit Tests

#### Component Tests
- **Button Component**: Tests all variants, sizes, and interactions
- **MessageBubble Component**: Tests message rendering, RTL/LTR text, timestamps
- **ChatInput Component**: Tests input handling, form submission, auto-resize

#### Context Tests
- **AuthContext**: Tests authentication flow, token management, user state
- **ThemeContext**: Tests theme switching, persistence, system preference

#### Hook Tests
- **useChatApi**: Tests API calls, error handling, data transformation

#### Utility Tests
- **Text Direction**: Tests RTL/LTR detection for Persian/English text
- **URL Utils**: Tests page URL generation and navigation
- **Admin Utils**: Tests admin user detection and permissions

### 2. Integration Tests

#### Page Integration
- **Chat Page**: Tests complete chat workflow with WebSocket integration
- **Login Page**: Tests authentication flow with API integration

### 3. End-to-End Tests

#### Authentication Flow
- Login form validation and submission
- Error handling for invalid credentials
- Successful login and redirection
- Network error handling

#### Chat Interface
- Message input and sending
- RTL/LTR text handling
- WebSocket connection and communication
- Responsive design on mobile
- Theme switching

## Test Utilities

### Custom Render Function
```javascript
import { render } from '@/__tests__/utils/test-utils'

// Renders component with all providers
render(<MyComponent />, {
  authValue: mockAuthContext,
  themeValue: mockThemeContext
})
```

### Mock Data
```javascript
import { mockUser, mockChat, mockMessage } from '@/__tests__/utils/test-utils'

// Use predefined mock data
const user = mockUser
const chat = mockChat
const message = mockMessage
```

### API Mocking
```javascript
import { server } from '@/__tests__/mocks/server'

// Override specific API response
server.use(
  http.get('/api/chat/1/messages/', () => {
    return HttpResponse.json([mockMessage])
  })
)
```

## Best Practices

### 1. Test Structure
- Use descriptive test names
- Group related tests with `describe` blocks
- Use `beforeEach` for common setup
- Clean up after tests with `afterEach`

### 2. Component Testing
- Test user interactions, not implementation details
- Use `screen.getByRole` for better accessibility
- Test error states and loading states
- Mock external dependencies

### 3. API Testing
- Use MSW for realistic API mocking
- Test both success and error scenarios
- Verify correct API calls are made
- Test data transformation

### 4. E2E Testing
- Test complete user workflows
- Use realistic test data
- Test responsive design
- Include accessibility checks

## Coverage Goals

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## Debugging Tests

### Jest Debugging
```bash
# Run specific test file
npm run test -- MessageBubble.test.jsx

# Run tests with verbose output
npm run test -- --verbose

# Debug failing tests
npm run test -- --detectOpenHandles
```

### Playwright Debugging
```bash
# Run tests in debug mode
npm run test:e2e -- --debug

# Run specific test
npm run test:e2e -- auth.spec.js

# Generate test report
npm run test:e2e -- --reporter=html
```

## Continuous Integration

The CI pipeline runs:
1. **Linting**: ESLint checks
2. **Unit Tests**: Jest with coverage
3. **E2E Tests**: Playwright tests
4. **Build**: Production build verification

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase test timeout in Jest config
   - Check for unclosed async operations

2. **MSW not working**
   - Ensure server is started in `beforeAll`
   - Check handler patterns match API calls

3. **E2E tests failing**
   - Verify test server is running
   - Check for race conditions
   - Use `waitFor` for async operations

4. **Coverage not updating**
   - Run `npm run test:coverage`
   - Check coverage thresholds in Jest config

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage thresholds
4. Update this documentation if needed

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MSW Documentation](https://mswjs.io/docs/)
