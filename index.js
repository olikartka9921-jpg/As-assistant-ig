/**
 * User-to-Assistant Role Switcher
 *
 * Changes only the newest user message in the outgoing generation prompt
 * to an assistant-role message. The chat-history object is not modified:
 * the message is cloned before its role flags are changed.
 */

const MODULE_NAME = 'user_to_assistant_role_switcher';

const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    debug: false,
});

function getSettings() {
    const context = SillyTavern.getContext();

    if (!context.extensionSettings[MODULE_NAME]) {
        context.extensionSettings[MODULE_NAME] = structuredClone(DEFAULT_SETTINGS);
    }

    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        if (!Object.hasOwn(context.extensionSettings[MODULE_NAME], key)) {
            context.extensionSettings[MODULE_NAME][key] = value;
        }
    }

    return context.extensionSettings[MODULE_NAME];
}

/**
 * SillyTavern calls this before building/sending a generation prompt.
 * `chat` is the prompt's message array.
 */
globalThis.convertLatestUserToAssistant = async function (chat, contextSize, abort, type) {
    const settings = getSettings();

    if (!settings.enabled || !Array.isArray(chat) || chat.length === 0) {
        return;
    }

    // Find the newest actual user message. Do not convert older user turns.
    let targetIndex = -1;

    for (let i = chat.length - 1; i >= 0; i--) {
        const message = chat[i];

        if (message && message.is_user === true && message.is_system !== true) {
            targetIndex = i;
            break;
        }
    }

    if (targetIndex === -1) {
        return;
    }

    // Clone before editing so the saved/displayed chat history stays intact.
    const convertedMessage = structuredClone(chat[targetIndex]);
    convertedMessage.is_user = false;
    convertedMessage.is_system = false;

    chat[targetIndex] = convertedMessage;

    if (settings.debug) {
        console.info(
            `[${MODULE_NAME}] Converted newest user message to assistant role.`,
            { index: targetIndex, generationType: type ?? 'unknown' },
        );
    }
};

// Add a small settings panel to Extensions.
function renderSettings() {
    const container = document.getElementById('extensions_settings2');

    if (!container || document.getElementById(`${MODULE_NAME}_settings`)) {
        return;
    }

    const settings = getSettings();
    const panel = document.createElement('div');
    panel.id = `${MODULE_NAME}_settings`;
    panel.className = 'extension_settings';

    panel.innerHTML = `
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>User-to-Assistant Role Switcher</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label">
                    <input id="${MODULE_NAME}_enabled" type="checkbox">
                    <span>Convert newest user message to Assistant role</span>
                </label>
                <label class="checkbox_label">
                    <input id="${MODULE_NAME}_debug" type="checkbox">
                    <span>Enable debug logging in browser console</span>
                </label>
                <small>
                    Only the newest user message in each outgoing prompt is converted.
                    Your saved chat history is left unchanged.
                </small>
            </div>
        </div>
    `;

    container.appendChild(panel);

    const enabledInput = panel.querySelector(`#${MODULE_NAME}_enabled`);
    const debugInput = panel.querySelector(`#${MODULE_NAME}_debug`);

    enabledInput.checked = settings.enabled;
    debugInput.checked = settings.debug;

    enabledInput.addEventListener('change', () => {
        getSettings().enabled = enabledInput.checked;
        SillyTavern.getContext().saveSettingsDebounced();
        console.info(`[${MODULE_NAME}] ${enabledInput.checked ? 'Enabled' : 'Disabled'}.`);
    });

    debugInput.addEventListener('change', () => {
        getSettings().debug = debugInput.checked;
        SillyTavern.getContext().saveSettingsDebounced();
    });
}

const context = SillyTavern.getContext();
context.eventSource.on(context.event_types.APP_READY, renderSettings);

// Also attempt once immediately in case the extension loads after APP_READY.
renderSettings();
