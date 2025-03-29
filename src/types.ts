export interface ReviewComment {
  id: string;
  content: string;
  lineNumber: number;
  filePath: string;
  isResolved: boolean;
}

export interface LLMResponse {
  improvedContent: string;
  pros: string[];
  cons: string[];
  suggestions: string[];
}

export interface EnhancedComment extends ReviewComment, LLMResponse {}

export interface ExtensionSettings {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
}

export type InitProgressCallback = (progress: number) => void;
