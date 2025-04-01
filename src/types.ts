export interface ReviewComment {
  id: string;
  content: string;
}

export type ExtensionSettings = {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  provider: "web-llm" | "OpenAI";
};

export type InitProgressCallback = (progress: number) => void;

// Service Worker types
declare global {
  interface ServiceWorkerGlobalScope {
    addEventListener(
      type: "install" | "activate" | "fetch",
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void;
  }
}
