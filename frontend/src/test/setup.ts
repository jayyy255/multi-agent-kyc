import '@testing-library/jest-dom';

// Mock performance.now for API client timer tests
if (!globalThis.performance) {
  (globalThis as any).performance = {
    now: () => Date.now(),
  };
}
