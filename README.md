# User Messages as Assistant

A small SillyTavern UI extension for testing whether GLM 5.3 behaves differently when user-authored turns are supplied with the `assistant` role.

## What it does

Before SillyTavern starts a generation, the extension changes the role flags on user messages in the outgoing generation context:

- `is_user: true` → `is_user: false`
- `is_system: false`

In SillyTavern's chat-context representation, that makes those messages assistant/character-role messages.

**It does not rewrite the saved chat history or change how messages appear in the chat UI.** It only changes the context array passed through the generation interceptor.

## Settings

Open **Extensions → User Messages as Assistant**.

- **Enable role conversion**: turns the behavior on or off.
- **All user messages in the prompt**: converts every user-authored message included in the current prompt. This is the default and usually gives the model a consistent role history.
- **Only the latest user message**: converts just the newest user-authored message in the prompt. This can create consecutive assistant-role turns, so treat it as a separate experiment.

Settings are stored in this browser's local storage.

## Important compatibility notes

- Intended for **Chat Completion** APIs, where messages have explicit `system`, `user`, and `assistant` roles.
- Text Completion APIs flatten the conversation into a text string and do not preserve API message roles. The extension skips several well-known Text Completion backends, but API identifiers can differ between SillyTavern versions and forks.
- Test on a duplicate chat first. This extension relies on SillyTavern's `generate_interceptor` extension API and the `is_user` / `is_system` message flags.
- If your mobile fork uses a substantially older or modified SillyTavern core, the interceptor or settings-panel selector may differ.

## Install from your private GitHub repository

1. Push this folder to a GitHub repository.
2. In SillyTavern, open **Extensions → Download Extensions & Assets**.
3. Add your repository URL as an extension URL and install it.
4. Reload SillyTavern, then open **Extensions** and enable the extension.

If your fork does not offer installation from a Git URL, copy this folder into its `public/scripts/extensions/third-party/` directory (the exact extension directory can vary by fork), then reload.

## Debugging

Open the browser developer console. When a generation is intercepted, the extension logs:

`[User Messages as Assistant] Converted N user message(s) in outgoing context.`

If there is no log, check that the extension loaded, is enabled, and that your fork supports `generate_interceptor`.

## Experiment design note

Changing the role changes more than the model's perception of agreement: it changes who the model thinks authored that turn. It may reduce one kind of user-following behavior, but it can also make the model treat your narration, dialogue, and instructions as its own prior output. Compare identical prompts with the extension on and off, and inspect the actual outgoing prompt if your ST build provides a prompt inspector.
