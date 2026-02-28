"use client";
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import {
  PostGenerationParameters,
  BrandProfile,
  AiSettings,
  AiProgress,
} from "@/lib/types";
import {
  getPromptById,
  preparePromptTemplate,
  generatePost,
} from "@/lib/prompts";
import { Loader, Clock, Copy, Download } from "lucide-react";

interface PostGeneratorProps {
  parameters: PostGenerationParameters;
  profile: BrandProfile;
  aiSettings: AiSettings;
  triggerGeneration: number;
  onContentGenerated: (content: string) => void;
}

export interface PostGeneratorRef {
  getGeneratedContent: () => string;
}

const PostGenerator = forwardRef<PostGeneratorRef, PostGeneratorProps>(
  (
    { parameters, profile, aiSettings, triggerGeneration, onContentGenerated },
    ref,
  ) => {
    const [generatedContent, setGeneratedContent] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [estimatedReadTime, setEstimatedReadTime] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [isContentSelected, setIsContentSelected] = useState<boolean>(false);
    const [aiProgress, setAiProgress] = useState<AiProgress | null>(null);

    const contentRef = useRef<HTMLTextAreaElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useImperativeHandle(ref, () => ({
      getGeneratedContent: () => generatedContent,
    }));

    const generateContentEffect = useCallback(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsGenerating(true);
      setError(null);
      setCopied(false);
      setIsContentSelected(false);
      setAiProgress(null);

      try {
        const promptTemplate = getPromptById(parameters.toneId);
        if (!promptTemplate) {
          throw new Error(
            `No prompt template found for tone: ${parameters.toneId}`,
          );
        }

        const preparedPrompt = preparePromptTemplate(
          promptTemplate.promptTemplate,
          {
            topic: parameters.topic,
            audience: profile.audience,
            coreTakeaway: parameters.coreTakeaway,
            ctaGoal: parameters.ctaGoal,
            contentPillar: parameters.contentPillar,
            hookPattern: parameters.hookPattern,
            postType: parameters.postType,
          },
        );

        const content = await generatePost(
          preparedPrompt,
          aiSettings,
          (progress) => setAiProgress(progress),
          controller.signal,
        );
        setGeneratedContent(content);
        onContentGenerated(content);

        const wordCount = content.split(/\s+/).length;
        setEstimatedReadTime(Math.max(1, Math.ceil(wordCount / 225)));
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while generating the post",
        );
      } finally {
        setIsGenerating(false);
        setAiProgress(null);
      }
    }, [parameters, profile, aiSettings, onContentGenerated]);

    useEffect(() => {
      if (
        triggerGeneration > 0 &&
        parameters.topic &&
        parameters.postType &&
        parameters.hookPattern &&
        parameters.contentPillar &&
        parameters.toneId
      ) {
        void generateContentEffect();
      }
    }, [triggerGeneration, generateContentEffect, parameters]);

    const copyToClipboard = async () => {
      if (contentRef.current) {
        try {
          contentRef.current.select();
          contentRef.current.setSelectionRange(0, generatedContent.length);
          contentRef.current.focus();
          setIsContentSelected(true);
          await navigator.clipboard.writeText(generatedContent);
          setCopied(true);
          setError(null);
        } catch (err) {
          console.error("Failed to copy to clipboard:", err);
          setError("Failed to copy to clipboard.");
          setCopied(false);
        } finally {
          setTimeout(() => {
            setIsContentSelected(false);
            setCopied(false);
          }, 2000);
        }
      }
    };

    const downloadAsText = () => {
      const element = document.createElement("a");
      const file = new Blob([generatedContent], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${parameters.topic.replace(/\s+/g, "_")}_post.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

    return (
      <div>
        {error && (
          <div
            style={{
              padding: "var(--bru-space-3)",
              border: "var(--bru-border)",
              background: "rgba(233, 152, 152, 0.15)",
              color: "var(--bru-error-dark)",
              marginBottom: "var(--bru-space-4)",
              fontSize: "var(--bru-text-md)",
            }}
          >
            {error}
          </div>
        )}

        {isGenerating ? (
          <div
            style={{
              minHeight: 256,
              border: "2px dashed var(--bru-grey-85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--bru-grey)",
              gap: "var(--bru-space-3)",
            }}
          >
            <Loader size={32} className="animate-spin" style={{ color: "var(--bru-purple)" }} />
            <p>{aiProgress?.step ?? "Generating your post..."}</p>
            {aiProgress && (
              <div style={{ width: 192, height: 8, background: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${aiProgress.percent}%`,
                    height: "100%",
                    background: "var(--bru-purple)",
                    transition: "width 300ms ease",
                  }}
                />
              </div>
            )}
            <p style={{ fontSize: "var(--bru-text-sm)" }}>Using {aiSettings.activeProvider}</p>
          </div>
        ) : generatedContent ? (
          <div className="bru-card bru-card--raised">
            <div style={{ display: "flex", alignItems: "center", fontSize: "var(--bru-text-sm)", color: "var(--bru-grey)", marginBottom: "var(--bru-space-2)", gap: "var(--bru-space-1)" }}>
              <Clock size={14} /> {estimatedReadTime} min read
            </div>
            <textarea
              ref={contentRef}
              style={{
                width: "100%",
                minHeight: 256,
                resize: "vertical",
                padding: "var(--bru-space-4)",
                border: isContentSelected ? "2px solid var(--bru-purple)" : "var(--bru-border)",
                boxShadow: isContentSelected ? "3px 3px 0 0 var(--bru-purple)" : "var(--bru-shadow-sm)",
                background: "var(--bru-white)",
                fontFamily: "var(--bru-font-mono)",
                fontSize: "var(--bru-text-md)",
                lineHeight: "var(--bru-leading-loose)",
                color: "var(--bru-black)",
                outline: "none",
              }}
              value={generatedContent}
              onChange={(e) => {
                setGeneratedContent(e.target.value);
                onContentGenerated(e.target.value);
              }}
            />
            <div className="bru-form-actions" style={{ marginTop: "var(--bru-space-3)" }}>
              <button
                className="bru-btn bru-btn--sm"
                onClick={void copyToClipboard}
              >
                <Copy size={14} />
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                className="bru-btn bru-btn--sm"
                onClick={downloadAsText}
              >
                <Download size={14} />
                Download
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              minHeight: 256,
              border: "2px dashed var(--bru-grey-85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--bru-grey)",
              padding: "var(--bru-space-6)",
              textAlign: "center",
            }}
          >
            <p>Fill in the form and click &quot;Generate Post&quot; to create your LinkedIn content</p>
          </div>
        )}
      </div>
    );
  },
);

export default PostGenerator;
