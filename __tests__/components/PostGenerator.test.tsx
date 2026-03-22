import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { TextEncoder, TextDecoder } from "util";

// Polyfill for jsdom
Object.assign(global, { TextEncoder, TextDecoder });

import PostGenerator from "@/components/PostGenerator";
import type {
  PostGenerationParameters,
  BrandProfile,
  AiSettings,
} from "@/lib/types";

// Mock @doctorproject/react components
jest.mock("@doctorproject/react", () => ({
  Alert: ({ variant, children }: any) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  Icon: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
  Loader: () => <span data-testid="ds-loader">Loading</span>,
}));

// --- Helpers for mocking fetch with SSE ---

const GENERATED_CONTENT =
  "This is a generated post content about the topic with engaging hooks and professional tone.";

/**
 * Build a fake ReadableStream body whose getReader() returns chunks of SSE data.
 * Works even when the global ReadableStream constructor is missing (jsdom).
 */
function createFakeSSEBody(content: string) {
  const encoder = new TextEncoder();
  // Build one big SSE payload with individual token events
  const tokens = content.split(" ");
  let ssePayload = "";
  tokens.forEach((tok, i) => {
    const piece = (i === 0 ? "" : " ") + tok;
    ssePayload += `data: ${JSON.stringify({ type: "token", content: piece })}\n\n`;
  });
  ssePayload += "data: [DONE]\n\n";

  const encoded = encoder.encode(ssePayload);
  let read = false;

  return {
    getReader() {
      return {
        read() {
          if (!read) {
            read = true;
            return Promise.resolve({ done: false, value: encoded });
          }
          return Promise.resolve({ done: true, value: undefined });
        },
      };
    },
  };
}

function mockFetchSuccess() {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      body: createFakeSSEBody(GENERATED_CONTENT),
    }),
  ) as any;
}

function mockFetchError(status = 500, message = "Server error") {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ error: message }),
    }),
  ) as any;
}

describe("PostGenerator", () => {
  const mockParameters: PostGenerationParameters = {
    topic: "AI in Healthcare",
    audience: ["healthcare-professionals"],
    coreTakeaway: "AI improves diagnostic accuracy",
    ctaGoal: "Learn more about AI tools",
    contentPillar: "education",
    contentAngle: "contrarian",
    postStructure: "opinionTake",
    triggerGeneration: 0,
  };

  const mockProfile: BrandProfile = {
    id: "brand-1",
    name: "Healthcare Insights",
    firstName: "Jane",
    lastName: "Doe",
    companyName: "Medical Tech Co",
    role: "Content Lead",
    aiProvider: "claude",
    claudeApiKey: "test-key",
    straicoApiKey: "",
    straicoModel: "",
    straicoImageModel: "",
    oneforallApiKey: "",
    oneforallModel: "",
    oneforallImageModel: "",
    industry: "healthcare",
    audience: ["healthcare-professionals"],
    tones: ["professional", "educational"],
    offers: ["insights", "tools"],
    taboos: ["medical-advice"],
    styleGuide: {
      emoji: false,
      hashtags: 2,
      links: "relevant",
    },
    copyGuideline: "Professional and accurate",
    contentStrategy: "Educate and engage",
    definition: "Evidence-based healthcare insights",
  };

  const mockAiSettings: AiSettings = {
    activeProvider: "claude",
    claudeApiKey: "test-key",
    straicoApiKey: "",
    straicoModel: "",
    straicoImageModel: "",
    oneforallApiKey: "",
    oneforallModel: "",
    oneforallImageModel: "",
  };

  const mockOnContentGenerated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSuccess();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders without crashing initially", () => {
    render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    expect(
      screen.getByText(/Fill in the form and click "Generate Post"/i),
    ).toBeInTheDocument();
  });

  test("shows placeholder message when no content generated", () => {
    render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    expect(
      screen.getByText(
        /Fill in the form and click "Generate Post" to create your LinkedIn content/,
      ),
    ).toBeInTheDocument();
  });

  test("triggers generation when triggerGeneration changes with valid parameters", async () => {
    const { rerender } = render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    await waitFor(() => {
      expect(mockOnContentGenerated).toHaveBeenCalledWith(
        expect.stringContaining("generated post content"),
      );
    });
  });

  test("displays generating state with loader", async () => {
    // Use a stream that never completes to keep the loading state visible
    global.fetch = jest.fn(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    ) as any;

    const { rerender } = render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("ds-loader")).toBeInTheDocument();
      expect(screen.getByText(/Generating your post/i)).toBeInTheDocument();
    });
  });

  test("displays generated content in textarea", async () => {
    const { rerender } = render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    await waitFor(() => {
      const textarea = screen.getByDisplayValue(
        /generated post content/,
      ) as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toContain("generated post content");
    });
  });

  test("shows copy button when content is generated", async () => {
    const { rerender } = render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Copy")).toBeInTheDocument();
    });
  });

  test("shows download button when content is generated", async () => {
    const { rerender } = render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Download")).toBeInTheDocument();
    });
  });

  test("displays estimated read time", async () => {
    const { rerender } = render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/min read/)).toBeInTheDocument();
    });
  });

  test("handles generation error state", async () => {
    mockFetchError(500, "Generation failed");

    const { rerender } = render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("alert")).toBeInTheDocument();
    });
  });

  test("does not trigger generation when topic is missing", async () => {
    const incompleteParams = { ...mockParameters, topic: "" };
    const { rerender } = render(
      <PostGenerator
        parameters={incompleteParams}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={incompleteParams}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("does not trigger generation when postStructure is missing", async () => {
    const incompleteParams = { ...mockParameters, postStructure: "" };
    const { rerender } = render(
      <PostGenerator
        parameters={incompleteParams}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={incompleteParams}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("calls onContentGenerated callback when content is generated", async () => {
    const { rerender } = render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    await waitFor(() => {
      expect(mockOnContentGenerated).toHaveBeenCalled();
    });
  });

  test("sends correct payload to generate endpoint", async () => {
    const { rerender } = render(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/create/generate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            topic: "AI in Healthcare",
            subtopic: "AI improves diagnostic accuracy",
            pillar: "education",
            contentAngle: "contrarian",
            postStructure: "opinionTake",
          }),
        }),
      );
    });
  });

  test("forwards ref to getGeneratedContent", async () => {
    const ref = React.createRef<any>();
    const { rerender } = render(
      <PostGenerator
        ref={ref}
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={0}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    rerender(
      <PostGenerator
        ref={ref}
        parameters={mockParameters}
        profile={mockProfile}
        aiSettings={mockAiSettings}
        triggerGeneration={1}
        onContentGenerated={mockOnContentGenerated}
      />,
    );

    await waitFor(() => {
      expect(ref.current?.getGeneratedContent()).toContain(
        "generated post content",
      );
    });
  });
});
