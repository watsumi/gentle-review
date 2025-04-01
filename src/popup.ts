import type { ExtensionSettings } from "./types";

class PopupUI {
  private settings: ExtensionSettings;

  constructor() {
    this.settings = {
      enabled: true,
      model: "llama-2-7b-chat",
      temperature: 0.7,
      maxTokens: 500,
      provider: "web-llm",
    };
    this.initialize();
  }

  private async initialize() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  private async loadSettings() {
    const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
    this.settings = response;
  }

  private setupEventListeners() {
    const toggleSwitch = document.getElementById(
      "toggle-enable"
    ) as HTMLInputElement;
    const modelSelect = document.getElementById(
      "model-select"
    ) as HTMLSelectElement;
    const temperatureInput = document.getElementById(
      "temperature"
    ) as HTMLInputElement;
    const maxTokensInput = document.getElementById(
      "max-tokens"
    ) as HTMLInputElement;
    const providerSelect = document.getElementById(
      "provider-select"
    ) as HTMLSelectElement;

    toggleSwitch.addEventListener("change", () => {
      this.settings.enabled = toggleSwitch.checked;
      this.saveSettings();
    });

    modelSelect.addEventListener("change", () => {
      this.settings.model = modelSelect.value;
      this.saveSettings();
    });

    temperatureInput.addEventListener("change", () => {
      this.settings.temperature = Number.parseFloat(temperatureInput.value);
      this.saveSettings();
    });

    maxTokensInput.addEventListener("change", () => {
      this.settings.maxTokens = Number.parseInt(maxTokensInput.value);
      this.saveSettings();
    });
  }

  private async saveSettings() {
    await chrome.runtime.sendMessage({
      type: "UPDATE_SETTINGS",
      settings: this.settings,
    });
  }

  private updateUI() {
    const toggleSwitch = document.getElementById(
      "toggle-enable"
    ) as HTMLInputElement;
    const modelSelect = document.getElementById(
      "model-select"
    ) as HTMLSelectElement;
    const temperatureInput = document.getElementById(
      "temperature"
    ) as HTMLInputElement;
    const maxTokensInput = document.getElementById(
      "max-tokens"
    ) as HTMLInputElement;
    const providerSelect = document.getElementById(
      "provider-select"
    ) as HTMLSelectElement;

    toggleSwitch.checked = this.settings.enabled;
    modelSelect.value = this.settings.model;
    temperatureInput.value = this.settings.temperature.toString();
    maxTokensInput.value = this.settings.maxTokens.toString();
    providerSelect.value = this.settings.provider;
  }
}

// Initialize the popup UI when the document is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PopupUI();
});
