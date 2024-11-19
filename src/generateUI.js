/**
 * Generates the UI for the URL Manager panel.
 * This function creates a Tailwind CSS-based responsive layout.
 * @returns {string} The HTML content for the panel.
 */
function generateUI() {
    return `
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>URL Manager</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet" />
        <style>
            /* Skeleton Loader */
            .skeleton {
                display: block;
                background-color: #e0e0e0;
                background-image: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
            }
            @keyframes loading {
                0% {
                    background-position: 200% 0;
                }
                100% {
                    background-position: -200% 0;
                }
            }
        </style>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center px-4">
        <div class="fixed bottom-5 left-5 flex space-x-4">
            <!-- Refresh Button -->
            <button
                id="refreshBottomBtn"
                class="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded shadow-lg flex items-center"
                title="Refresh"
            >
                <i class="fas fa-sync-alt mr-2"></i> Refresh
            </button>

            <!-- Settings Button -->
            <button
                id="settingsBtn"
                class="bg-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded shadow-lg flex items-center"
                title="Open Settings"
            >
                <i class="fas fa-cog mr-2"></i> Settings
            </button>
        </div>

        <div class="container mx-auto max-w-4xl bg-white rounded-lg shadow-md p-6 mt-10 mb-10">
            <!-- Form -->
            <div class="form-group mb-6">
                <input
                    id="longUrl"
                    type="url"
                    class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-600 focus:text-blue-600"
                    placeholder="Enter Long URL (e.g., https://example.com)"
                />
                <button
                    id="createBtn"
                    class="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                    Generate Short URL
                </button>
            </div>

            <!-- Skeleton Loading for URL List -->
            <div id="urlCardList" class="space-y-4">
                <div class="skeleton w-full h-20 rounded-md"></div>
                <div class="skeleton w-full h-20 rounded-md"></div>
                <div class="skeleton w-full h-20 rounded-md"></div>
            </div>

            <!-- Pagination -->
            <div id="pagination" class="pagination mt-6 flex justify-center space-x-2"></div>
        </div>

        <!-- Edit Modal -->
        <div
            id="editModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden"
        >
            <div class="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
                <button
                    id="modalCloseBtn"
                    class="absolute top-3 right-3 text-gray-600 hover:text-red-600"
                >
                    &times;
                </button>
                <div class="text-lg font-semibold mb-4 text-center">Edit Short URL</div>
                <input
                    id="editLongUrl"
                    type="url"
                    disabled
                    class="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:border-blue-600 focus:text-blue-600"
                    placeholder="Long URL"
                />
                <input
                    id="editShortUrl"
                    type="text"
                    class="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:border-blue-600 focus:text-blue-600"
                    placeholder="Edit Short URL"
                />
                <div class="flex space-x-4">
                    <button
                        id="saveEdit"
                        class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                        Save
                    </button>
                    <button
                        id="cancelEdit"
                        class="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let editingId = "";

            // Show notification
            function showNotification(message, isSuccess) {
                const notification = document.createElement("div");
                notification.className =
                    "fixed bottom-5 left-1/2 transform -translate-x-1/2 " +
                    (isSuccess ? "bg-blue-600" : "bg-red-600") +
                    " text-white py-2 px-6 rounded-lg shadow-lg text-sm";
                notification.textContent = message;
                document.body.appendChild(notification);

                setTimeout(() => notification.remove(), 3000); // Duration: 3 seconds
            }

            // Validate URL
            function isValidUrl(url) {
                try {
                    new URL(url);
                    return true;
                } catch {
                    return false;
                }
            }

            // Event Listeners
            document.getElementById("createBtn").addEventListener("click", () => {
                const longUrl = document.getElementById("longUrl").value.trim();
                if (!isValidUrl(longUrl)) {
                    showNotification("Please enter a valid URL.", false);
                    return;
                }
                vscode.postMessage({ command: "generateUrl", longUrl });
                showNotification("Generating short URL...", true);
            });

            document.getElementById("refreshBottomBtn").addEventListener("click", () => {
                vscode.postMessage({ command: "fetchUrls", page: 1 });
                showNotification("Refreshing URL list...", true);
            });

            document.getElementById("settingsBtn").addEventListener("click", () => {
                vscode.postMessage({ command: "openSettingsJson" });
            });

            document.getElementById("modalCloseBtn").addEventListener("click", () => {
                document.getElementById("editModal").classList.add("hidden");
            });

            document.getElementById("cancelEdit").addEventListener("click", () => {
                document.getElementById("editModal").classList.add("hidden");
            });

            document.getElementById("saveEdit").addEventListener("click", () => {
                const newShortUrl = document.getElementById("editShortUrl").value.trim();
                const longUrl = document.getElementById("editLongUrl").value;
                if (!newShortUrl) {
                    showNotification("Short URL cannot be empty.", false);
                    return;
                }
                vscode.postMessage({
                    command: "editUrl",
                    id: editingId,
                    newShort: newShortUrl,
                    longUrl,
                });
                document.getElementById("editModal").classList.add("hidden");
                showNotification("Saving changes...", true);
            });

            // Handle messages from the backend
            window.addEventListener("message", (event) => {
                const { command, message, urls, pagination } = event.data;

                if (command === "notification") {
                    showNotification(message, true);
                }

                if (command === "updateList") {
                    const urlCardList = document.getElementById("urlCardList");
                    urlCardList.innerHTML = "";
                    urls.forEach((url) => {
                        const card = document.createElement("div");
                        card.className = "bg-gray-50 p-4 rounded-lg shadow flex flex-col space-y-2 relative";

                        const idDiv = document.createElement("div");
                        idDiv.className = "text-gray-500 text-sm";
                        idDiv.textContent = "ID: " + url.id;
                        card.appendChild(idDiv);

                        const shortUrlDiv = document.createElement("div");
                        shortUrlDiv.className = "font-semibold text-lg text-gray-700";
                        shortUrlDiv.textContent = "Short URL: ";
                        const shortLink = document.createElement("a");
                        shortLink.href = "https://s.id/" + url.short;
                        shortLink.textContent = "https://s.id/" + url.short;
                        shortLink.className = "text-blue-600 hover:underline";
                        shortUrlDiv.appendChild(shortLink);
                        card.appendChild(shortUrlDiv);

                        const longUrlDiv = document.createElement("div");
                        longUrlDiv.className = "text-sm break-words text-gray-700";
                        longUrlDiv.textContent = "Long URL: " + url.long_url;
                        card.appendChild(longUrlDiv);

                        const actionsDiv = document.createElement("div");
                        actionsDiv.className = "absolute top-3 right-3 flex space-x-2";

                        const copyBtn = document.createElement("button");
                        copyBtn.className = "bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 flex items-center";
                        copyBtn.innerHTML = '<i class="fas fa-copy mr-2"></i>Copy';
                        copyBtn.addEventListener("click", () => {
                            navigator.clipboard.writeText("https://s.id/" + url.short);
                            showNotification("Short URL copied to clipboard.", true);
                        });
                        actionsDiv.appendChild(copyBtn);

                        const editBtn = document.createElement("button");
                        editBtn.className = "bg-orange-600 text-white py-1 px-3 rounded hover:bg-orange-700 flex items-center";
                        editBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit';
                        editBtn.addEventListener("click", () => {
                            editingId = url.id;
                            document.getElementById("editLongUrl").value = url.long_url;
                            document.getElementById("editShortUrl").value = url.short;
                            document.getElementById("editModal").classList.remove("hidden");
                        });
                        actionsDiv.appendChild(editBtn);

                        card.appendChild(actionsDiv);
                        urlCardList.appendChild(card);
                    });

                    const paginationContainer = document.getElementById("pagination");
                    paginationContainer.innerHTML = "";
                    for (let i = 1; i <= pagination.totalPages; i++) {
                        const pageBtn = document.createElement("button");
                        pageBtn.textContent = i;
                        pageBtn.className =
                            "py-1 px-3 rounded border border-gray-300" +
                            (i === pagination.currentPage ? " bg-blue-600 text-white" : " bg-white text-gray-600");
                        pageBtn.addEventListener("click", () => {
                            vscode.postMessage({ command: "fetchUrls", page: i });
                        });
                        paginationContainer.appendChild(pageBtn);
                    }
                }
            });
        </script>
    </body>
    </html>
    `;
}

module.exports = {
    generateUI,
};
