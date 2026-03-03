import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock data generators
export const createMockBrandProfile = (overrides = {}) => ({
  id: 'test-profile-id',
  firstName: 'John',
  lastName: 'Doe',
  companyName: 'Test Company',
  role: 'Marketing Manager',
  industry: 'Technology',
  audience: ['Tech professionals', 'Startup founders'],
  copyGuideline: 'Professional and engaging tone',
  contentStrategy: 'Focus on educational content',
  definition: 'Innovative tech company',
  aiProvider: 'claude' as const,
  claudeApiKey: 'test-claude-key',
  straicoApiKey: 'test-straico-key',
  straicoModel: 'openai/gpt-4o-mini',
  oneforallApiKey: 'test-oneforall-key',
  oneforallModel: 'anthropic/claude-4-sonnet',
  perplexityApiKey: 'test-perplexity-key',
  redditClientId: 'test-reddit-client-id',
  redditClientSecret: 'test-reddit-client-secret',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockScheduledPost = (overrides = {}) => ({
  id: 'test-post-id',
  title: 'Test Post Title',
  content: 'This is a test post content.',
  pillar: 'Technology',
  hook: 'Did you know?',
  closer: 'What do you think?',
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  status: 'scheduled' as const,
  factoryScore: 85,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockDocument = (overrides = {}) => ({
  id: 'test-doc-id',
  name: 'Test Document',
  category: 'rules' as const,
  subcategory: 'brand-voice',
  content: 'This is test document content.',
  version: 1,
  source: 'import',
  is_active: true,
  updated_by: 'test-user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockSignal = (overrides = {}) => ({
  id: 'test-signal-id',
  observation: 'Test observation',
  category: 'tone',
  signalType: 'feedback' as const,
  sessionId: 'test-session-id',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockCampaign = (overrides = {}) => ({
  id: 'test-campaign-id',
  name: 'Test Campaign',
  description: 'Test campaign description',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  pillar: 'Technology',
  status: 'active' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Mock functions
export const mockFetch = jest.fn();
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
};

// Setup common mocks
export const setupCommonMocks = () => {
  // Mock fetch
  global.fetch = mockFetch;
  
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
  });

  return { localStorageMock, sessionStorageMock };
};

// Wait for element to be removed
export const waitForElementToBeRemoved = async (element: HTMLElement) => {
  await new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
};