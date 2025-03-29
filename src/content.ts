import { ReviewComment, EnhancedComment } from "./types";
import { ReviewLLM } from "./llm";

class GitHubReviewEnhancer {
  private llm: ReviewLLM;
  private observer: MutationObserver;

  constructor() {
    this.llm = new ReviewLLM();
    this.observer = new MutationObserver(this.handleDOMChanges.bind(this));
    this.initialize();
  }

  private async initialize() {
    this.showInitializationMessage();
    await this.llm.initialize((progress) => {
      this.updateInitializationProgress(progress);
    });
    this.hideInitializationMessage();
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private showInitializationMessage() {
    const message = document.createElement("div");
    message.id = "gentle-review-init-message";
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0366d6;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    message.textContent = "Initializing Gentle Review...";
    document.body.appendChild(message);
  }

  private updateInitializationProgress(progress: number) {
    const message = document.getElementById("gentle-review-init-message");
    if (message) {
      message.textContent = `Initializing Gentle Review... ${Math.round(
        progress * 100
      )}%`;
    }
  }

  private hideInitializationMessage() {
    const message = document.getElementById("gentle-review-init-message");
    if (message) {
      message.remove();
    }
  }

  private handleDOMChanges(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        this.processNewComments();
      }
    }
  }

  private async processNewComments() {
    const comments = this.findReviewComments();
    for (const comment of comments) {
      if (!this.hasEnhancementButton(comment)) {
        await this.enhanceComment(comment);
      }
    }
  }

  private findReviewComments(): Element[] {
    return Array.from(document.querySelectorAll(".review-comment"));
  }

  private hasEnhancementButton(comment: Element): boolean {
    return !!comment.querySelector(".gentle-review-enhance");
  }

  private async enhanceComment(commentElement: Element) {
    const comment = this.extractCommentData(commentElement);
    if (!comment) return;

    const llmResponse = await this.llm.enhanceComment(comment);
    const enhancedComment: EnhancedComment = {
      ...comment,
      ...llmResponse,
    };
    this.addEnhancementButton(commentElement, enhancedComment);
  }

  private extractCommentData(commentElement: Element): ReviewComment | null {
    const contentElement = commentElement.querySelector(".comment-body");
    const lineNumberElement = commentElement.querySelector(".line-number");

    if (!contentElement || !lineNumberElement) return null;

    return {
      id: commentElement.getAttribute("data-comment-id") || "",
      content: contentElement.textContent || "",
      lineNumber: parseInt(lineNumberElement.textContent || "0"),
      filePath: this.getFilePath(commentElement),
      isResolved: false,
    };
  }

  private getFilePath(commentElement: Element): string {
    const fileHeader = commentElement.closest(".file-header");
    return fileHeader?.querySelector(".file-info")?.textContent || "";
  }

  private addEnhancementButton(
    commentElement: Element,
    enhancedComment: EnhancedComment
  ) {
    const button = document.createElement("button");
    button.className = "gentle-review-enhance";
    button.textContent = "Enhance Comment";
    button.onclick = () =>
      this.showEnhancedComment(commentElement, enhancedComment);

    const actionsContainer = commentElement.querySelector(".comment-actions");
    if (actionsContainer) {
      actionsContainer.appendChild(button);
    }
  }

  private showEnhancedComment(
    commentElement: Element,
    enhancedComment: EnhancedComment
  ) {
    const contentElement = commentElement.querySelector(".comment-body");
    if (!contentElement) return;

    const enhancedContent = `
      <div class="gentle-review-enhanced">
        <h4>Enhanced Comment:</h4>
        <p>${enhancedComment.improvedContent}</p>
        <h4>Pros:</h4>
        <ul>
          ${enhancedComment.pros?.map((pro) => `<li>${pro}</li>`).join("")}
        </ul>
        <h4>Cons:</h4>
        <ul>
          ${enhancedComment.cons?.map((con) => `<li>${con}</li>`).join("")}
        </ul>
        <h4>Suggestions:</h4>
        <ul>
          ${enhancedComment.suggestions
            ?.map((suggestion) => `<li>${suggestion}</li>`)
            .join("")}
        </ul>
      </div>
    `;

    contentElement.insertAdjacentHTML("beforeend", enhancedContent);
  }
}

// Initialize the enhancer when the page loads
new GitHubReviewEnhancer();
