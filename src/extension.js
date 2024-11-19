const vscode = require('vscode');
const { showAuthSettings } = require("./auth");
const { showUrlManager } = require("./panel");

/**
 * Activates the extension and registers commands.
 * @param {vscode.ExtensionContext} context - The extension context.
 */
function activate(context) {
    // Create a status bar item for the URL Manager
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right, 
        100 // Higher priority to align right
    );
    statusBarItem.text = "$(link) URL Manager"; // Icon and label for the status bar item
    statusBarItem.command = "extension.openUrlManager"; // Command to execute when clicked
    statusBarItem.tooltip = "";
    statusBarItem.show(); // Display the status bar item

    /**
     * Command for opening authentication settings.
     * Allows the user to configure their API credentials (X-Auth-Id and X-Auth-Key).
     */
    const authCommand = vscode.commands.registerCommand("extension.openAuthSettings", async () => {
        await showAuthSettings();
    });

    /**
     * Command for opening the URL Manager.
     * Verifies that the API credentials are configured before launching the URL Manager.
     */
    const urlManagerCommand = vscode.commands.registerCommand("extension.openUrlManager", async () => {
        const { authId, authKey } = getAuthConfig(); // Retrieve API credentials

        if (!authId || !authKey) {
            // Prompt the user to configure credentials if missing
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
            // Launch the URL Manager if credentials are present
            await showUrlManager(authId, authKey);
        }
    });

    // Register commands and status bar item with the extension context
    context.subscriptions.push(authCommand, urlManagerCommand, statusBarItem);
}

/**
 * Retrieves authentication configuration from the workspace settings.
 * @returns {Object} - The authentication configuration containing `authId` and `authKey`.
 */
function getAuthConfig() {
    const config = vscode.workspace.getConfiguration("urlShortener");
    return {
        authId: config.get("authId"),
        authKey: config.get("authKey"),
    };
}

/**
 * Deactivates the extension (currently a placeholder).
 */
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
