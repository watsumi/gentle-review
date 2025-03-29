# Gentle Review

Gentle Review is a Chrome extension that enhances code review comments on GitHub by using AI to make them more constructive and meaningful. It helps reviewers provide better feedback by suggesting improvements to potentially harsh or unclear comments.

## Features

- Automatically detects code review comments on GitHub
- Enhances comments to be more constructive and detailed
- Provides pros and cons of suggested changes
- Offers additional suggestions for improvement
- Customizable settings for AI model and parameters
- Clean and intuitive user interface

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` directory

## Usage

1. Navigate to a GitHub pull request
2. When you see a code review comment, click the "Enhance Comment" button
3. The extension will analyze the comment and provide:
   - An improved version of the comment
   - Pros of the suggested changes
   - Cons or potential concerns
   - Additional suggestions for improvement

## Settings

You can customize the extension's behavior through the popup settings:

- Enable/disable the extension
- Choose the AI model (Llama 2 7B/13B/70B Chat)
- Adjust temperature (controls randomness)
- Set maximum token length for responses

## Development

To start development:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development build:

   ```bash
   npm run dev
   ```

3. Make changes to the source files in the `src` directory

4. The extension will automatically rebuild when you make changes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
