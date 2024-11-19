const vscode = require('vscode');
const axios = require("axios");
const { AxiosError } = require("axios");
const { generateUI } = require("./generateUI");

const BASE_URL = "https://api.s.id/v1"; // Base API URL for all requests

/**
 * Opens the URL Manager webview and initializes message handling.
 * @param {string} authId - The X-Auth-Id for API authentication.
 * @param {string} authKey - The X-Auth-Key for API authentication.
 */
async function showUrlManager(authId, authKey) {
    const panel = vscode.window.createWebviewPanel(
        "urlManager",
        "URL Manager",
        vscode.ViewColumn.One,
        { enableScripts: true } // Allow JavaScript execution in the webview
    );

    panel.webview.html = generateUI();

    // Handle messages sent from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        try {
            await handleMessage(message, authId, authKey, panel);
        } catch (error) {
            handleError(error, panel);
        }
    });

    // Load initial list of URLs
    await refreshList(authId, authKey, panel, 1);
}

/**
 * Handles incoming messages from the webview.
 * @param {object} message - The message data from the webview.
 * @param {string} authId - The X-Auth-Id for API authentication.
 * @param {string} authKey - The X-Auth-Key for API authentication.
 * @param {object} panel - The webview panel instance.
 */
async function handleMessage(message, authId, authKey, panel) {
    const commandHandlers = {
        /**
         * Handles the generation of a new short URL.
         */
        generateUrl: async () => {
            if (!isValidUrl(message.longUrl)) {
                return sendNotification(panel, "Please enter a valid URL.", false);
            }

            try {
                await generateShortUrl(message.longUrl, authId, authKey);
                await refreshList(authId, authKey, panel, 1);
                sendNotification(panel, "Short URL successfully generated.", true);
            } catch (error) {
                sendNotification(panel, `Failed to generate short URL: ${error.message}`, false);
            }
        },

        /**
         * Handles the editing of an existing short URL.
         */
        editUrl: async () => {
            if (!message.newShort || message.newShort.trim() === "") {
                return sendNotification(panel, "Short URL cannot be empty.", false);
            }

            try {
                await updateLink(message.id, message.newShort, message.longUrl, authId, authKey);
                await refreshList(authId, authKey, panel, 1);
                sendNotification(panel, "Short URL updated successfully.", true);
            } catch (error) {
                sendNotification(panel, `Failed to update short URL: ${error.message}`, false);
            }
        },

        /**
         * Fetches a specific page of short URLs from the server.
         */
        fetchUrls: async () => {
            try {
                await refreshList(authId, authKey, panel, message.page || 1);
            } catch (error) {
                sendNotification(panel, "Failed to fetch URL list.", false);
            }
        },

        /**
         * Sends a notification when a short URL is copied to the clipboard.
         */
        notifyCopySuccess: () => {
            sendNotification(panel, message.message, true);
        },

        /**
         * Opens the settings.json file for user configuration.
         */
        openSettingsJson: () => {
            vscode.commands.executeCommand("workbench.action.openSettingsJson");
            sendNotification(panel, "Opening settings.json...", true);
        },
    };

    const handler = commandHandlers[message.command];
    if (!handler) {
        throw new Error(`Unknown command received: ${message.command}`);
    }

    await handler();
}

/**
 * Validates whether a given string is a valid URL.
 * @param {string} url - The URL to validate.
 * @returns {boolean} - True if the URL is valid, otherwise false.
 */
function isValidUrl(url) {
    if (!url || url.trim() === "") return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Fetches and updates the URL list displayed in the webview.
 * @param {string} authId - The X-Auth-Id for API authentication.
 * @param {string} authKey - The X-Auth-Key for API authentication.
 * @param {object} panel - The webview panel instance.
 * @param {number} page - The page number to fetch.
 */
async function refreshList(authId, authKey, panel, page) {
    try {
        const urls = await fetchUrlList(authId, authKey, page);
        const totalUrls = await fetchTotalCount(authId, authKey);
        const totalPages = Math.ceil(totalUrls / 10);

        panel.webview.postMessage({
            command: "updateList",
            urls,
            pagination: {
                currentPage: page,
                totalPages,
            },
        });
    } catch (error) {
        vscode.window.showErrorMessage("Failed to refresh URL list.");
        throw error;
    }
}

/**
 * Sends a request to generate a new short URL.
 * @param {string} longUrl - The original long URL to shorten.
 * @param {string} authId - The X-Auth-Id for API authentication.
 * @param {string} authKey - The X-Auth-Key for API authentication.
 */
async function generateShortUrl(longUrl, authId, authKey) {
    const response = await axios.post(
        `${BASE_URL}/links`,
        { long_url: longUrl },
        {
            headers: {
                "X-Auth-Id": authId,
                "X-Auth-Key": authKey,
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.data?.data?.short) {
        throw new Error("Failed to generate short URL.");
    }
}

/**
 * Fetches a list of short URLs for a specific page.
 * @param {string} authId - The X-Auth-Id for API authentication.
 * @param {string} authKey - The X-Auth-Key for API authentication.
 * @param {number} page - The page number to fetch.
 * @returns {Promise<Array<{id: string, long_url: string, short: string}>>} - A promise that resolves to the list of short URLs.
 */
async function fetchUrlList(authId, authKey, page) {
    const response = await axios.get(`${BASE_URL}/links`, {
        params: { page },
        headers: {
            "X-Auth-Id": authId,
            "X-Auth-Key": authKey,
        },
    });

    if (!response.data?.data) {
        throw new Error("Failed to fetch URL list.");
    }

    return response.data.data.map((url) => ({
        id: url.id,
        long_url: url.long_url,
        short: url.short,
    }));
}

/**
 * Fetches the total count of short URLs.
 * @param {string} authId - The X-Auth-Id for API authentication.
 * @param {string} authKey - The X-Auth-Key for API authentication.
 * @returns {Promise<number>} - A promise that resolves to the total number of short URLs.
 */
async function fetchTotalCount(authId, authKey) {
    const response = await axios.get(`${BASE_URL}/links?count_only=true`, {
        headers: {
            "X-Auth-Id": authId,
            "X-Auth-Key": authKey,
        },
    });

    if (response.data.total === undefined) {
        throw new Error("Failed to fetch total count.");
    }

    return response.data.total;
}

/**
 * Sends a request to update an existing short URL.
 * @param {string} id - The ID of the short URL.
 * @param {string} short - The new short name for the URL.
 * @param {string} longUrl - The long URL associated with the short URL.
 * @param {string} authId - The X-Auth-Id for API authentication.
 * @param {string} authKey - The X-Auth-Key for API authentication.
 */
async function updateLink(id, short, longUrl, authId, authKey) {
    const response = await axios.post(
        `${BASE_URL}/links/${id}`,
        { short, long_url: longUrl },
        {
            headers: {
                "X-Auth-Id": authId,
                "X-Auth-Key": authKey,
                "Content-Type": "application/json",
            },
        }
    );

    if (response.data?.message !== "link_updated") {
        throw new Error("Failed to update the link.");
    }
}

/**
 * Sends a notification to the webview.
 * @param {object} panel - The webview panel instance.
 * @param {string} message - The notification message.
 * @param {boolean} isSuccess - Whether the notification indicates success.
 */
function sendNotification(panel, message, isSuccess = true) {
    panel.webview.postMessage({
        command: "notification",
        message,
        isSuccess,
    });
}

/**
 * Handles errors and displays appropriate messages.
 * @param {Error} error - The error object.
 * @param {object|null} panel - The webview panel instance (optional).
 */
function handleError(error, panel = null) {
    // Cast error to AxiosError if applicable
    if (error instanceof AxiosError && error.response) {
        const { code, message } = error.response.data;

        if (code === 422 && message === "change_shortname_limit_reached") {
            vscode.window.showErrorMessage("You have reached the limit for changing short names.");
            if (panel) {
                sendNotification(panel, "Limit reached: You cannot edit more short URLs today.", false);
            }
        } else if (error.response.status === 403) {
            vscode.window.showErrorMessage("Access denied. Please check your authentication credentials.");
        } else if (error.response.status === 404) {
            vscode.window.showErrorMessage("The requested resource was not found.");
        } else {
            vscode.window.showErrorMessage(`Unexpected Error: ${message || "An unknown error occurred."}`);
        }
    } else if (error instanceof AxiosError && error.request) {
        vscode.window.showErrorMessage("No response from the server. Please check your connection.");
    } else {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
}

module.exports = {
    showUrlManager,
};
