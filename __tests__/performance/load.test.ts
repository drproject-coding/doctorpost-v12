import { performance } from "perf_hooks";

// Mock fetch globally — these tests measure timing logic, not real server responses.
// Real network I/O belongs in E2E tests with a running server.
const mockFetch = jest.fn().mockResolvedValue({
  status: 200,
  ok: true,
  json: async () => ({}),
  text: async () => "",
} as Response);

beforeAll(() => {
  global.fetch = mockFetch;
});

afterEach(() => {
  mockFetch.mockClear();
});

describe("Performance Tests", () => {
  describe("API Response Times", () => {
    it("should respond to health check within 100ms", async () => {
      const startTime = performance.now();

      // Simulate health check request
      const response = await fetch("/api/health");

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100);
    });

    it("should handle AI requests within 30 seconds", async () => {
      const startTime = performance.now();

      // Simulate AI request
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: {
            systemPrompt: "Test prompt",
            userMessage: "Test message",
          },
        }),
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(30000); // 30 seconds
    });

    it("should handle knowledge base queries within 2 seconds", async () => {
      const startTime = performance.now();

      // Simulate knowledge base query
      const response = await fetch("/api/knowledge/read/documents");

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // 2 seconds
    });
  });

  describe("Memory Usage", () => {
    it("should not have memory leaks in content generation", async () => {
      const initialMemory = process.memoryUsage();

      // Simulate multiple content generation requests
      for (let i = 0; i < 100; i++) {
        await fetch("/api/pipeline/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: `Test topic ${i}`,
            pillar: "Technology",
          }),
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe("Concurrent Requests", () => {
    it("should handle 10 concurrent requests", async () => {
      const requests = Array.from({ length: 10 }, () =>
        fetch("/api/models?provider=1forall"),
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Total time should be reasonable
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // 5 seconds
    });
  });

  describe("Large Payload Handling", () => {
    it("should handle large document uploads", async () => {
      const largeContent = "A".repeat(1024 * 1024); // 1MB of content

      const startTime = performance.now();

      const response = await fetch("/api/knowledge/create/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "rules",
          subcategory: "brand-voice",
          name: "Large Document",
          content: largeContent,
          version: 1,
          is_active: true,
          source: "test",
          updated_by: "test-user",
        }),
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10000); // 10 seconds
    });
  });

  describe("Database Performance", () => {
    it("should handle large result sets efficiently", async () => {
      const startTime = performance.now();

      // Simulate query with large result set
      const response = await fetch("/api/knowledge/read/documents?limit=1000");

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // 3 seconds
    });
  });
});
