import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import { PostGenerationParameters, BrandProfile } from "../lib/types";
import {
  getPromptById,
  preparePromptTemplate,
  generatePost,
} from "../lib/prompts";
import { Loader, Clock, Copy, Download } from "lucide-react";

interface PostGeneratorProps {
  parameters: PostGenerationParameters;
  profile: BrandProfile;
  triggerGeneration: number; // New prop to trigger generation
  onContentGenerated: (content: string) => void; // Callback to pass generated content to parent
}

export interface PostGeneratorRef {
  getGeneratedContent: () => string;
}

const PostGenerator = forwardRef<PostGeneratorRef, PostGeneratorProps>(
  ({ parameters, profile, triggerGeneration, onContentGenerated }, ref) => {
    const [generatedContent, setGeneratedContent] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [estimatedReadTime, setEstimatedReadTime] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [isContentSelected, setIsContentSelected] = useState<boolean>(false); // New state for visual selection

    const contentRef = useRef<HTMLTextAreaElement>(null); // Ref for the textarea

    // Expose generated content via ref
    useImperativeHandle(ref, () => ({
      getGeneratedContent: () => generatedContent,
    }));

    const generateContentEffect = useCallback(async () => {
      setIsGenerating(true);
      setError(null);
      setCopied(false);
      setIsContentSelected(false); // Reset selection state

      try {
        // Get the prompt template for the selected tone
        const promptTemplate = getPromptById(parameters.toneId);

        if (!promptTemplate) {
          throw new Error(
            `No prompt template found for tone: ${parameters.toneId}`,
          );
        }

        // Prepare the prompt with parameters
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

        // Generate the content
        const content = await generatePost(preparedPrompt);
        setGeneratedContent(content);
        onContentGenerated(content); // Pass content to parent

        // Calculate estimated read time (approx. 225 words per minute)
        const wordCount = content.split(/\s+/).length;
        setEstimatedReadTime(Math.max(1, Math.ceil(wordCount / 225)));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while generating the post",
        );
      } finally {
        setIsGenerating(false);
      }
    }, [parameters, profile, onContentGenerated]); // Dependencies for useCallback

    useEffect(() => {
      // Only trigger generation if triggerGeneration is greater than 0
      // and all required parameters are present
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
    }, [triggerGeneration, generateContentEffect, parameters]); // Added generateContentEffect to deps

    const copyToClipboard = async () => {
      if (contentRef.current) {
        try {
          // Select all text in the textarea
          contentRef.current.select();
          // Fallback for select() and ensure full range is selected
          contentRef.current.setSelectionRange(0, generatedContent.length);
          contentRef.current.focus(); // Ensure focus

          setIsContentSelected(true); // Apply visual feedback for selection

          await navigator.clipboard.writeText(generatedContent);

          setCopied(true);
          setError(null); // Clear any previous error
        } catch (err) {
          console.error("Failed to copy to clipboard:", err);
          setError(
            "Failed to copy to clipboard. Please ensure your browser grants clipboard access.",
          );
          setCopied(false);
        } finally {
          // Clear visual selection and copied status after a delay
          setTimeout(() => {
            setIsContentSelected(false);
            setCopied(false); // Reset copied state after timeout
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
      <div className="post-generator">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="post-content-container">
          {isGenerating ? (
            <div className="post-generating-placeholder h-64 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500">
              <Loader size={32} className="animate-spin mb-3" />
              <p>Generating your post...</p>
              <p className="text-sm mt-2">This typically takes 15-20 seconds</p>
            </div>
          ) : generatedContent ? (
            <div className="post-content-display">
              <div className="post-metadata flex items-center text-sm text-gray-500 mb-2">
                <Clock size={14} className="mr-1" /> {estimatedReadTime} min
                read
              </div>
              <textarea
                ref={contentRef}
                className={`post-content border rounded-md p-4 bg-white w-full h-64 resize-none font-mono text-sm leading-relaxed ${isContentSelected ? "ring-2 ring-purple-electric ring-offset-2" : ""}`}
                value={generatedContent}
                onChange={(e) => {
                  setGeneratedContent(e.target.value);
                  onContentGenerated(e.target.value);
                }}
              ></textarea>
              <div className="post-generator-actions flex space-x-2 mt-4">
                <button
                  className="neo-button secondary px-3 py-1 flex items-center text-sm"
                  onClick={void copyToClipboard}
                >
                  <Copy size={14} className="mr-1" />{" "}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  className="neo-button secondary px-3 py-1 flex items-center text-sm"
                  onClick={downloadAsText}
                >
                  <Download size={14} className="mr-1" /> Download
                </button>
              </div>
            </div>
          ) : (
            <div className="post-empty-state h-64 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-500">
              <p className="text-center">
                Fill in the form above and click &quot;Generate Post&quot; to
                create your LinkedIn content
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default PostGenerator;
