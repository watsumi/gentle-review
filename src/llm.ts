import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { ReviewComment, LLMResponse, InitProgressCallback } from "./types";

interface ModelRecord {
  model: string;
  model_id: string;
  model_lib: string;
}

interface AppConfig {
  model_list: ModelRecord[];
}

export class ReviewLLM {
  private engine: any;
  private initialized: boolean = false;

  constructor() {
    this.engine = null;
  }

  async initialize(progressCallback?: InitProgressCallback) {
    if (this.initialized) return;

    const appConfig: AppConfig = {
      model_list: [
        {
          model: "https://huggingface.co/mlc-ai/Llama-2-7b-chat-hf-q4f32_1",
          model_id: "Llama-2-7b-chat-hf",
          model_lib:
            "https://huggingface.co/mlc-ai/Llama-2-7b-chat-hf-q4f32_1/Llama-2-7b-chat-hf-q4f32_1.wasm",
        },
      ],
    };

    const chatOpts = {
      temperature: 0.7,
      max_tokens: 500,
      repetition_penalty: 1.1,
    };

    this.engine = await CreateMLCEngine(
      "Llama-2-7b-chat-hf",
      { appConfig },
      chatOpts
    );

    this.initialized = true;
  }

  async enhanceComment(comment: ReviewComment): Promise<LLMResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    const prompt = this.generatePrompt(comment);
    const response = await this.engine.generate(prompt);

    return this.parseResponse(response);
  }

  private generatePrompt(comment: ReviewComment): string {
    return `Please analyze this code review comment and provide a more constructive and detailed response:

Original comment: "${comment.content}"

Please provide:
1. An improved version of the comment that is more constructive and detailed
2. Pros of the suggested changes
3. Cons or potential concerns
4. Additional suggestions for improvement

Format the response as JSON with the following structure:
{
  "improvedContent": "string",
  "pros": ["string"],
  "cons": ["string"],
  "suggestions": ["string"]
}`;
  }

  private parseResponse(response: string): LLMResponse {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      return {
        improvedContent: response,
        pros: [],
        cons: [],
        suggestions: [],
      };
    }
  }
}
