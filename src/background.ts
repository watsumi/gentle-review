import { ExtensionSettings } from "./types";

class BackgroundService {
  private settings: ExtensionSettings;

  constructor() {
    this.settings = {
      enabled: true,
      model: "llama-2-7b-chat",
      temperature: 0.7,
      maxTokens: 500,
    };
    this.initialize();
  }

  private async initialize() {
    await this.loadSettings();
    this.setupListeners();
  }

  private async loadSettings() {
    const stored = await chrome.storage.sync.get("settings");
    if (stored.settings) {
      this.settings = { ...this.settings, ...stored.settings };
    }
  }

  private setupListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "GET_SETTINGS") {
        sendResponse(this.settings);
      } else if (message.type === "UPDATE_SETTINGS") {
        this.updateSettings(message.settings);
      }
    });
  }

  private async updateSettings(newSettings: Partial<ExtensionSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    await chrome.storage.sync.set({ settings: this.settings });
  }
}

// Initialize the background service
new BackgroundService();
