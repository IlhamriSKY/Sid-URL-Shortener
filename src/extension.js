const vscode = require("vscode");
const axios = require("axios");
const { showAuthSettings } = require("./auth");
const { showUrlManager } = require("./panel");

function activate(context) {
    // Create a status bar item for opening the URL Manager
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(link) URL Manager"; // Icon and label for the status bar item
    statusBarItem.command = "extension.openUrlManager"; // Command to execute when clicked
    statusBarItem.tooltip = "Fetching URL count..."; // Default tooltip

    // Function to fetch the number of URLs created
    const updateUrlCountTooltip = async () => {
        try {
            const { authId, authKey } = getAuthConfig();
            if (authId && authKey) {
                const urlCount = await getUrlCount(authId, authKey);
                statusBarItem.tooltip = `Number of URLs created: ${urlCount}`; // Update tooltip
            } else {
                statusBarItem.tooltip = "Please set up authentication"; // Display message when no auth
            }
        } catch (error) {
            statusBarItem.tooltip = "Failed to fetch URL count"; // Error message in tooltip
        }
    };

    // Update the tooltip initially
    updateUrlCountTooltip();
    statusBarItem.show();

    // Command for opening authentication settings
    const authCommand = vscode.commands.registerCommand("extension.openAuthSettings", async () => {
        await showAuthSettings();
    });

    // Command for opening the URL Manager
    const urlManagerCommand = vscode.commands.registerCommand("extension.openUrlManager", async () => {
        const { authId, authKey } = getAuthConfig();

        if (!authId || !authKey) {
            vscode.window
                .showErrorMessage(
                    "Please configure X-Auth-Id and X-Auth-Key first.",
                    "Open Settings"
                )
                .then((selection) => {
                    if (selection === "Open Settings") {
                        vscode.commands.executeCommand("extension.openAuthSettings");
                    }
                });
        } else {
            await showUrlManager(authId, authKey);
        }
    });

    // Update the tooltip when the user opens the URL Manager
    vscode.commands.registerCommand("extension.openUrlManager", async () => {
        updateUrlCountTooltip();
    });

    // Add commands and status bar item to subscriptions
    context.subscriptions.push(authCommand, urlManagerCommand, statusBarItem);
}

// Function to get the current authentication settings
function getAuthConfig() {
    const config = vscode.workspace.getConfiguration("urlShortener");
    return {
        authId: config.get("authId"),
        authKey: config.get("authKey"),
    };
}

// Function to fetch the URL count from the backend (example)
async function getUrlCount(authId, authKey) {
    try {
        const response = await axios.get("https://api.s.id/v1/links?count_only=true", {
            headers: {
                "X-Auth-Id": authId,
                "X-Auth-Key": authKey,
            },
        });
        return response.data.total; // Return the total number of URLs
    } catch (error) {
        throw new Error("Failed to fetch URL count");
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
