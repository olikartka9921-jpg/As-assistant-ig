(() => {
    "use strict";

    const EXTENSION_KEY = "user_messages_as_assistant";
    const STORAGE_KEY = "st_user_messages_as_assistant_settings";
    const DEFAULT_SETTINGS = {
        enabled: true,
        scope: "all" // "all" or "latest"
    };

    function loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            return { ...DEFAULT_SETTINGS, ...saved };
        } catch (error) {
            console.warn("[User Messages as Assistant] Could not read settings; using defaults.", error);
            return { ...DEFAULT_SETTINGS };
        }
    }

    let settings = loadSettings();

    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error("[User Messages as Assistant] Could not save settings.", error);
        }
    }

    /**
     * SillyTavern calls this before generation with the outgoing chat context.
     * The interceptor edits this prompt-context array, not the persisted chat
     * messages displayed in the conversation.
     */
    globalThis.userMessagesAsAssistantInterceptor = function (chat, contextSize, abort, type) {
        if (!settings.enabled || !Array.isArray(chat) || chat.length === 0) {
            return;
        }

        // Role conversion is meaningful for Chat Completion APIs. In Text
        // Completion mode, messages are flattened into one text prompt.
        // SillyTavern's main_api values vary by version/fork, so explicitly
        // skip the well-known Text Completion backends.
        let context = {};
        try {
            context = SillyTavern.getContext?.() || {};
        } catch (_) {
            context = {};
        }

        const api = String(context.main_api || "").toLowerCase();
        const textCompletionApis = new Set([
            "kobold", "koboldcpp", "novel", "textgenerationwebui",
            "ooba", "tabby", "aphrodite", "llamacpp", "llamacpp"
        ]);
        if (textCompletionApis.has(api)) {
            return;
        }

        const userMessages = [];
        for (let i = 0; i < chat.length; i++) {
            const message = chat[i];
            if (message && message.is_user === true && message.is_system !== true) {
                userMessages.push(message);
            }
        }

        if (userMessages.length === 0) {
            return;
        }

        const targets = settings.scope === "latest"
            ? [userMessages[userMessages.length - 1]]
            : userMessages;

        for (const message of targets) {
            // In SillyTavern's chat-context format, is_user=false and
            // is_system=false represent an assistant/character message.
            message.is_user = false;
            message.is_system = false;
        }

        console.debug(
            `[User Messages as Assistant] Converted ${targets.length} user message(s) in outgoing context.`
        );
    };

    function addSettingsUi() {
        const $ = window.jQuery;
        if (!$) {
            console.warn("[User Messages as Assistant] jQuery not available; settings UI was not added.");
            return;
        }

        const $container = $("#extensions_settings");
        if (!$container.length || $(`#${EXTENSION_KEY}_settings`).length) {
            return;
        }

        const html = `
            <div id="${EXTENSION_KEY}_settings" class="extension_block">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>User Messages as Assistant</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        <label class="checkbox_label">
                            <input id="${EXTENSION_KEY}_enabled" type="checkbox">
                            <span>Enable role conversion</span>
                        </label>
                        <small class="notes">
                            Changes message roles in the outgoing generation context only.
                            Your visible chat history is not rewritten.
                        </small>
                        <label for="${EXTENSION_KEY}_scope" class="marginTop5">Messages to convert</label>
                        <select id="${EXTENSION_KEY}_scope" class="text_pole">
                            <option value="all">All user messages in the prompt</option>
                            <option value="latest">Only the latest user message</option>
                        </select>
                        <small class="notes">
                            Recommended: convert all messages so the conversation history
                            keeps a consistent role interpretation.
                        </small>
                    </div>
                </div>
            </div>
        `;

        $container.append(html);
        $(`#${EXTENSION_KEY}_enabled`).prop("checked", settings.enabled);
        $(`#${EXTENSION_KEY}_scope`).val(settings.scope);

        $(`#${EXTENSION_KEY}_enabled`).on("change", function () {
            settings.enabled = this.checked;
            saveSettings();
        });

        $(`#${EXTENSION_KEY}_scope`).on("change", function () {
            settings.scope = this.value === "latest" ? "latest" : "all";
            saveSettings();
        });
    }

    // The extension script is loaded after the page has started. Retry briefly
    // because mobile forks can build the Extensions panel later than desktop ST.
    function init(attempt = 0) {
        addSettingsUi();
        if (!document.querySelector(`#${EXTENSION_KEY}_settings`) && attempt < 20) {
            setTimeout(() => init(attempt + 1), 500);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => init(), { once: true });
    } else {
        init();
    }
})();
