import { ReviewLLM } from "./llm";

class GitHubReviewEnhancer {
  private llm: ReviewLLM;

  constructor() {
    this.llm = new ReviewLLM();
    this.llm.setInitializationChangeCallback((isInitialized) => {
      this.updateEnhanceButtons(isInitialized);
    });
    this.initialize();
  }

  private async initialize() {
    this.showInitializationMessage();
    await this.replaceCommentToButtons();
    await this.llm.initialize((progress) => {
      this.updateInitializationProgress(progress);
    });
    this.hideInitializationMessage();
  }

  private showInitializationMessage() {
    const message = document.createElement("div");
    message.id = "gentle-review-init-message";

    const header = document.createElement("div");
    header.id = "gentle-review-init-header";

    const titleContainer = document.createElement("div");
    titleContainer.style.cssText =
      "display: flex; gap: 8px; align-items: center;";

    const title = document.createElement("div");
    title.id = "gentle-review-init-title";
    title.textContent = "Initializing Gentle Review";

    const loadingCircle = document.createElement("div");
    loadingCircle.className = "gentle-review-loading-circle";

    titleContainer.appendChild(title);
    titleContainer.appendChild(loadingCircle);

    const closeButton = document.createElement("button");
    closeButton.id = "gentle-review-close-button";
    closeButton.innerHTML = "×";
    closeButton.onclick = () => message.remove();

    header.appendChild(titleContainer);
    header.appendChild(closeButton);
    message.appendChild(header);

    const progressContainer = document.createElement("div");
    progressContainer.id = "gentle-review-progress-container";
    progressContainer.style.display = "hidden";

    const progressBar = document.createElement("div");
    progressBar.id = "gentle-review-progress-bar";
    progressContainer.appendChild(progressBar);

    const status = document.createElement("div");
    status.id = "gentle-review-status";

    message.appendChild(progressContainer);
    message.appendChild(status);
    document.body.appendChild(message);
  }

  private updateInitializationProgress(progress: number) {
    const progressContainer = document.getElementById(
      "gentle-review-progress-container"
    );
    if (progressContainer) progressContainer.style.display = "block";

    const progressBar = document.getElementById("gentle-review-progress-bar");
    const status = document.getElementById("gentle-review-status");

    if (!status) return;

    const progressText = Math.round(progress * 100);
    if (progressBar) progressBar.style.width = `${progressText}%`;

    if (progress < 0.3) {
      status.textContent = `Loading model...${progressText}%`;
    } else if (progress < 0.6) {
      status.textContent = `Preparing for enhancement...${progressText}%`;
    } else if (progress < 0.9) {
      status.textContent = `Almost ready...${progressText}%`;
    } else {
      status.textContent = `Initialization complete!${progressText}%`;
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

  private findReviewComments(): Element[] {
    return Array.from(
      document.querySelectorAll(".timeline-comment, .review-comment")
    );
  }

  private async enhanceComment(commentElement: Element) {
    const commentId = commentElement.id;
    const comment = commentElement.getAttribute("data-comment");
    if (!comment || comment.trim() === "") {
      this.showToast("コメントが見つかりませんでした。");
      return;
    }

    const loadingCircle = document.createElement("div");
    loadingCircle.className = "gentle-review-loading-circle";

    const button = commentElement.querySelector(".gentle-review-enhance");
    try {
      if (!button) throw new Error("Button container not found.");
      button.insertAdjacentElement("beforebegin", loadingCircle);

      const reviewComment = { id: commentId, content: comment };
      const chunks = await this.llm.enhanceComment(reviewComment);

      let reply = "";
      const contentElement = document.getElementById(commentElement.id);
      if (!contentElement) throw new Error("Content element not found.");

      const enhancedContent = document.createElement("p");
      button.insertAdjacentElement("beforebegin", enhancedContent);

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta.content || "";
        reply += content;
        enhancedContent.innerHTML = reply;
      }
    } catch (error) {
      console.error("Error processing chunks:", error);
      this.showToast("コメントの生成中にエラーが発生しました。");
    } finally {
      loadingCircle.remove();
    }
  }

  private extractCommentData(
    commentElement: Element
  ): string | null | undefined {
    return commentElement.querySelector("p")?.textContent;
  }

  private showEnhancedComment(
    commentElement: Element,
    enhancedComment: string
  ) {
    const contentElement = document.getElementById(commentElement.id);
    if (!contentElement) return;

    const enhancedContent = document.createElement("p");
    enhancedContent.innerHTML = enhancedComment;

    commentElement.appendChild(enhancedContent);
  }

  private updateEnhanceButtons(isInitialized: boolean) {
    const enhanceButtons = document.querySelectorAll(".gentle-review-enhance");
    for (const button of enhanceButtons) {
      if (button instanceof HTMLButtonElement) {
        button.disabled = !isInitialized;
      }
    }
  }

  private async replaceCommentToButtons() {
    const comments = this.findReviewComments();
    for (const comment of comments) {
      const contentElement = comment.querySelector(".comment-body");
      if (contentElement) {
        const commentData = this.extractCommentData(contentElement);
        comment.setAttribute("data-comment", commentData || "");
        // Create container for buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "gentle-review-button-container";
        buttonContainer.style.cssText = "display: flex; gap: 8px;";

        // Create and setup enhance button
        const enhanceButton = document.createElement("button");
        enhanceButton.className = "gentle-review-enhance";
        enhanceButton.textContent = "Enhance Comment";
        enhanceButton.disabled = !this.llm.isInitialized;
        enhanceButton.onclick = async (e) => {
          e.preventDefault();
          if (enhanceButton.disabled) return;
          enhanceButton.disabled = true;
          await this.enhanceComment(comment);
          enhanceButton.disabled = false;
        };

        // Create and setup show original button
        const showOriginalButton = document.createElement("button");
        showOriginalButton.className = "gentle-review-show-original";
        showOriginalButton.textContent = "Show Original Comment";
        showOriginalButton.onclick = (e) => {
          e.preventDefault();
          for (let i = 0; i < contentElement.children.length; i++) {
            contentElement.children[i].setAttribute("style", "display: block;");
          }
          contentElement.removeChild(buttonContainer);
          contentElement.appendChild(enhanceButton);
        };

        // Append buttons to container
        buttonContainer.appendChild(enhanceButton);
        buttonContainer.appendChild(showOriginalButton);

        // Clear and append new content
        for (let i = 0; i < contentElement.children.length; i++) {
          contentElement.children[i].setAttribute("style", "display: none;");
        }
        contentElement.appendChild(buttonContainer);
      }
    }
  }

  private showToast(message: string, duration = 3000) {
    const toast = document.createElement("div");
    toast.className = "gentle-review-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger reflow
    toast.offsetHeight;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Initialize the enhancer when the page loads
new GitHubReviewEnhancer();
