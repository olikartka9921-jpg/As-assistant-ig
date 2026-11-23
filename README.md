# User-to-Assistant Role Switcher

A small SillyTavern extension for experimenting with Chat Completion message roles.

## What it does

Before generation, the extension finds the newest user message in the outgoing prompt and changes its role flags so SillyTavern treats it as an **Assistant** message.

- Only the newest user message is converted.
- Earlier user messages remain user messages.
- The message is cloned before modification, so the saved/displayed chat history is not changed.
- The extension can be enabled or disabled in **Extensions**.
- Optional debug logging is available in the browser console.

## Important notes

- Intended for Chat Completion APIs that preserve message roles.
- Text Completion APIs do not use the same role-based message array, so this extension will not have the intended effect there.
- Backend prompt converters, proxies, or provider-specific processing may merge or rewrite roles after SillyTavern builds the prompt.
- Converting a user turn into an assistant turn changes the conversation structure. Some models or providers may reject, normalize, or interpret the resulting role sequence differently.
- This is an experimental prompt modification, not a guaranteed way to reduce sycophancy.

## Installation

### From a Git repository

1. Push these files to the root of a GitHub repository.
2. In SillyTavern, open **Extensions → Download Extensions & Assets**.
3. Use the option to install an extension from a Git repository URL, if available in your build.
4. Enter your repository URL and install.
5. Reload SillyTavern and enable the extension if necessary.

### Manual installation

Copy the entire repository folder into your SillyTavern third-party extensions directory, then reload the page.

The exact directory can differ between standard SillyTavern and mobile forks.

## Testing

1. Open the Extensions panel.
2. Ensure **Convert newest user message to Assistant role** is checked.
3. Send a test message.
4. Inspect the outgoing prompt using a prompt-inspection tool or your backend's request logs.
5. Confirm the newest message has role `assistant`, while older user turns remain `user`.
6. Disable the checkbox to return to normal behavior.

Enable debug logging to see a console entry each time a message is converted.

## Files

- `manifest.json` — SillyTavern extension metadata and interceptor registration.
- `index.js` — prompt interceptor and settings UI.
