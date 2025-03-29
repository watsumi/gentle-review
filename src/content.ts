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
      background: #ffffff;
      color: #24292e;
      padding: 16px 24px;
      border-radius: 6px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      min-width: 300px;
    `;

    const title = document.createElement("div");
    title.style.cssText = `
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 14px;
    `;
    title.textContent = "Initializing Gentle Review";
    message.appendChild(title);

    const progressContainer = document.createElement("div");
    progressContainer.style.cssText = `
      background: #e1e4e8;
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
      margin: 8px 0;
    `;

    const progressBar = document.createElement("div");
    progressBar.id = "gentle-review-progress-bar";
    progressBar.style.cssText = `
      background: #0366d6;
      height: 100%;
      width: 0%;
      transition: width 0.3s ease-in-out;
    `;
    progressContainer.appendChild(progressBar);

    const status = document.createElement("div");
    status.id = "gentle-review-status";
    status.style.cssText = `
      font-size: 12px;
      color: #586069;
    `;
    status.textContent = "Loading model...";

    message.appendChild(progressContainer);
    message.appendChild(status);
    document.body.appendChild(message);
  }

  private updateInitializationProgress(progress: number) {
    const progressBar = document.getElementById("gentle-review-progress-bar");
    const status = document.getElementById("gentle-review-status");

    if (progressBar) {
      progressBar.style.width = `${Math.round(progress * 100)}%`;
    }

    if (status) {
      if (progress < 0.3) {
        status.textContent = "Loading model...";
      } else if (progress < 0.6) {
        status.textContent = "Preparing for enhancement...";
      } else if (progress < 0.9) {
        status.textContent = "Almost ready...";
      } else {
        status.textContent = "Initialization complete!";
      }
    }
  }

  private hideInitializationMessage() {
    const message = document.getElementById("gentle-review-init-message");
    if (message) {
      message.style.opacity = "0";
      message.style.transition = "opacity 0.3s ease-in-out";
      setTimeout(() => message.remove(), 300);
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
