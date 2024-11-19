const vscode = require('vscode');

/**
 * Displays input prompts to configure authentication settings for the URL Shortener.
 * Prompts the user to input `X-Auth-Id` and `X-Auth-Key`, then saves them to the global settings.
 */
async function showAuthSettings() {
    try {
        // Prompt for X-Auth-Id
        const authId = await vscode.window.showInputBox({
            prompt: 'Enter X-Auth-Id',
            ignoreFocusOut: true, // Keep the input box visible even when focus is lost
        });

        // Prompt for X-Auth-Key
        const authKey = await vscode.window.showInputBox({
            prompt: 'Enter X-Auth-Key',
            password: true, // Hide input for sensitive data
            ignoreFocusOut: true,
        });

        // Check if both inputs are provided
        if (authId && authKey) {
            const config = vscode.workspace.getConfiguration('urlShortener');

            // Save both settings globally
            await Promise.all([
                config.update('authId', authId, vscode.ConfigurationTarget.Global),
                config.update('authKey', authKey, vscode.ConfigurationTarget.Global),
            ]);

            // Notify the user that authentication was saved successfully
            vscode.window.showInformationMessage('Authentication settings saved successfully.');
        } else {
            // Warn the user if either input is missing
            vscode.window.showWarningMessage('Authentication setup is incomplete. Both fields are required.');
        }
    } catch (error) {
        // Handle unexpected errors
        vscode.window.showErrorMessage(`An error occurred while saving authentication settings: ${error.message}`);
    }
}

module.exports = {
    showAuthSettings,
};
