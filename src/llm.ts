import type { ReviewComment, InitProgressCallback } from "./types";
import {
  type ChatCompletionMessageParam,
  type MLCEngineInterface,
  prebuiltAppConfig,
  CreateExtensionServiceWorkerMLCEngine,
  hasModelInCache,
  type ChatCompletionChunk,
} from "@mlc-ai/web-llm";

export class ReviewLLM {
  private engine: MLCEngineInterface | null;
  private readonly MODEL_ID = "Llama-3.1-8B-Instruct-q4f32_1-MLC";
  private onInitializationChange?: (isInitialized: boolean) => void;
  private _isInitialized = false;

  constructor() {
    this.engine = null;
  }

  setInitializationChangeCallback(callback: (isInitialized: boolean) => void) {
    this.onInitializationChange = callback;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  set isInitialized(value: boolean) {
    this._isInitialized = value;
    this.onInitializationChange?.(value);
  }

  async initialize(onProgress?: InitProgressCallback): Promise<void> {
    if (this.isInitialized) return;

    try {
      const appConfig = prebuiltAppConfig;
      // IndexedDB キャッシュを有効化
      appConfig.useIndexedDBCache = true;

      // キャッシュの存在確認
      const modelCached = await hasModelInCache(this.MODEL_ID, appConfig);
      console.log("Model cache status:", modelCached);

      // キャッシュが存在しない場合はダウンロード
      if (!modelCached) {
        console.log("Downloading model...");
        // ServiceWorker を使用したエンジンの初期化
        this.engine = await CreateExtensionServiceWorkerMLCEngine(
          this.MODEL_ID,
          {
            appConfig,
            initProgressCallback: (report) => onProgress?.(report.progress),
          }
        );
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize LLM:", error);
      this.isInitialized = false;
      throw error;
    }
  }

  async enhanceComment(
    comment: ReviewComment
  ): Promise<AsyncIterable<ChatCompletionChunk>> {
    if (!this.isInitialized || !this.engine) {
      throw new Error("LLM is not initialized");
    }

    const chatOpts = {
      temperature: 0.7,
      max_tokens: 500,
      repetition_penalty: 1.1,
      use_simd: true,
    };

    const messages = this.generateMessages(comment);
    const response = await this.engine.chat.completions.create({
      stream: true,
      messages,
      ...chatOpts,
    });

    return response;
  }

  private generateMessages(
    comment: ReviewComment
  ): ChatCompletionMessageParam[] {
    return [
      {
        role: "system",
        content: `
**Role**: You are a Multilingual Code Review Gentle Assistant - Transform comments gently while preserving both technical intent and original language

**Input**: Raw code review comment (may contain harsh tone/implicit assumptions)

**Language Rule**:
- Respond in the same language as the input comment
- Maintain technical terms in English (e.g., "Mutex", "recursion")
- Keep code references unchanged ([file:line], variable names)

**Process**:
1. Detect input language automatically
2. Apply all transformation rules while maintaining source language
3. Localize only non-technical phrases (e.g., "Let's" → "〜しましょう" in Japanese)
4. Adopt reviewer's persona while filtering emotional language
5. Identify core technical intent behind the original comment
6. Restructure using sandwich method (positive → improvement → encouragement)
7. Add reasoning ("Why") and list pros/cons if relevant
8. Suggest concrete solutions with code examples when applicable

**Output Rules**:
- Use markdown-free plain text
- Maintain original technical accuracy
- Prioritize actionable verbs ("Consider...", "Could we...")
- Use collaborative language ("Let's...", "We might...")
- Include severity level: [Critical/Important/Suggestion]
- Do not use the examples in the Output Examples section for actual output

**Input Examples**:
1. English:
"This error handling is terrible"

2. French:
"erreur typographique"

3. Japanese:
"タイポ"

**Output Examples**:
1. English:
"Let's strengthen the error handling in [file:api_service.go]. Adding recovery middleware would prevent cascading failures (Why). Example: defer recover() (Severity: Critical)"

2. French:
"Corriger l'orthographe de configration → configuration. Il est important de conserver une dénomination cohérente pour éviter toute confusion. (Importance : faible)"

3. Japanese:
"configration → configuration のスペルを修正しましょう。混乱を防ぐために、一貫した命名を維持することが重要です。 (重要度: 低)"
`,
      },
      {
        role: "user",
        content: comment.content,
      },
    ];
  }
}
