import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import PostGenerator from "@/components/PostGenerator";
import type {
  PostGenerationParameters,
  BrandProfile,
  AiSettings,
} from "@/lib/types";

// Mock @bruddle/react components
jest.mock("@bruddle/react", () => ({
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
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Loader: () => <span data-testid="icon-loader">L</span>,
  Clock: () => <span data-testid="icon-clock">C</span>,
  Copy: () => <span data-testid="icon-copy">CP</span>,
  Download: () => <span data-testid="icon-download">D</span>,
}));

// Mock lib/prompts
jest.mock("@/lib/prompts", () => ({
  getPromptById: jest.fn((id: string) => ({
    id,
    name: `Tone ${id}`,
    description: "Test prompt",
    promptTemplate: "Test template: {{topic}}",
  })),
  preparePromptTemplate: jest.fn((template: string, vars: any) =>
    template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || ""),
  ),
  generatePost: jest.fn(
    async (prompt: string, settings: any, onProgress: any, signal: any) => {
      onProgress({ step: "Generating...", percent: 50 });
      return "This is a generated post content about the topic with engaging hooks and professional tone.";
    },
  ),
}));

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

    expect(screen.getByTestId("icon-loader")).toBeInTheDocument();
    expect(
      screen.getByText(/Generating your post|Generating.../i),
    ).toBeInTheDocument();
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
      expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
      expect(screen.getByText(/min read/)).toBeInTheDocument();
    });
  });

  test("handles generation error state", async () => {
    const { getPromptById } = require("@/lib/prompts");
    getPromptById.mockReturnValueOnce(null);

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

    // Content should not be generated
    expect(
      screen.queryByText(/generated post content/),
    ).not.toBeInTheDocument();
  });

  test("does not trigger generation when postType is missing", async () => {
    const incompleteParams = { ...mockParameters, postType: "" };
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

    expect(
      screen.queryByText(/generated post content/),
    ).not.toBeInTheDocument();
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

  test("displays progress information during generation", async () => {
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

    // Progress bar should be visible during generation
    await waitFor(() => {
      const progressBar = document.querySelector('div[style*="width: 50%"]');
      expect(
        progressBar || screen.getByTestId("icon-loader"),
      ).toBeInTheDocument();
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
