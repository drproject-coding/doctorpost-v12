"use client";
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import { Alert, Button, Card, Loader, ProgressBar } from "@doctorproject/react";
import {
  PostGenerationParameters,
  BrandProfile,
  AiSettings,
  AiProgress,
} from "@/lib/types";
import { Clock, Copy, Download } from "lucide-react";

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
    const isGeneratingRef = useRef(false);
    const onContentGeneratedRef = useRef(onContentGenerated);
    onContentGeneratedRef.current = onContentGenerated;

    useImperativeHandle(ref, () => ({
      getGeneratedContent: () => generatedContent,
    }));

    const generateContentEffect = useCallback(async () => {
      if (isGeneratingRef.current) return;
      isGeneratingRef.current = true;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsGenerating(true);
      setError(null);
      setCopied(false);
      setIsContentSelected(false);
      setAiProgress(null);

      try {
        setAiProgress({ step: "Generating your post...", percent: 10 });

        const res = await fetch("/api/create/generate", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: parameters.topic,
            subtopic: parameters.coreTakeaway,
            pillar: parameters.contentPillar,
            contentAngle: parameters.contentAngle,
            postStructure: parameters.postStructure,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Server error" }));
          throw new Error(
            (err as { message?: string; error?: string }).message ??
              (err as { error?: string }).error ??
              `Generation failed (${res.status})`,
          );
        }

        // Read SSE stream
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const event = JSON.parse(data) as {
                type: string;
                content?: string;
              };
              if (event.type === "token" && event.content) {
                accumulated += event.content;
                setGeneratedContent(accumulated);
                setAiProgress({ step: "Writing...", percent: 50 });
              }
            } catch {
              // skip unparseable SSE lines
            }
          }
        }

        setGeneratedContent(accumulated);
        onContentGeneratedRef.current(accumulated);

        const wordCount = accumulated.split(/\s+/).length;
        setEstimatedReadTime(Math.max(1, Math.ceil(wordCount / 225)));
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while generating the post",
        );
      } finally {
        isGeneratingRef.current = false;
        setIsGenerating(false);
        setAiProgress(null);
      }
    }, [parameters, profile, aiSettings]);

    useEffect(() => {
      if (
        triggerGeneration > 0 &&
        parameters.topic &&
        parameters.postStructure &&
        parameters.contentAngle &&
        parameters.contentPillar
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
          <div style={{ marginBottom: "var(--drp-space-4)" }}>
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {isGenerating ? (
          <div
            style={{
              minHeight: 256,
              border: "2px dashed var(--drp-grey-85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--drp-grey)",
              gap: "var(--drp-space-3)",
            }}
          >
            <Loader size="lg" />
            <p>{aiProgress?.step ?? "Generating your post..."}</p>
            {aiProgress && (
              <div style={{ width: 192 }}>
                <ProgressBar value={aiProgress.percent} />
              </div>
            )}
            <p style={{ fontSize: "var(--drp-text-sm)" }}>
              Using {aiSettings.activeProvider}
            </p>
          </div>
        ) : generatedContent ? (
          <Card variant="raised">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "var(--drp-text-sm)",
                color: "var(--drp-grey)",
                marginBottom: "var(--drp-space-2)",
                gap: "var(--drp-space-1)",
              }}
            >
              <Clock size={14} /> {estimatedReadTime} min read
            </div>
            <textarea
              ref={contentRef}
              className="drp-input"
              style={{
                width: "100%",
                minHeight: 256,
                resize: "vertical",
                padding: "var(--drp-space-4)",
                border: isContentSelected
                  ? "2px solid var(--drp-purple)"
                  : "var(--drp-border)",
                boxShadow: isContentSelected
                  ? "3px 3px 0 0 var(--drp-purple)"
                  : "var(--drp-shadow-sm)",
                background: "var(--drp-white)",
                fontFamily: "var(--drp-font-mono)",
                fontSize: "var(--drp-text-md)",
                lineHeight: "var(--drp-leading-loose)",
                color: "var(--drp-black)",
                outline: "none",
              }}
              value={generatedContent}
              onChange={(e) => {
                setGeneratedContent(e.target.value);
                onContentGenerated(e.target.value);
              }}
            />
            <div
              className="drp-form-actions"
              style={{ marginTop: "var(--drp-space-3)" }}
            >
              <Button size="sm" onClick={() => copyToClipboard()}>
                <Copy size={14} />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button size="sm" onClick={downloadAsText}>
                <Download size={14} />
                Download
              </Button>
            </div>
          </Card>
        ) : (
          <div
            style={{
              minHeight: 256,
              border: "2px dashed var(--drp-grey-85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--drp-grey)",
              padding: "var(--drp-space-6)",
              textAlign: "center",
            }}
          >
            <p>
              Fill in the form and click &quot;Generate Post&quot; to create
              your LinkedIn content
            </p>
          </div>
        )}
      </div>
    );
  },
);

export default PostGenerator;
