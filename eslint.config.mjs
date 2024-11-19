const path = require("path");

module.exports = {
    mode: "development", // Set to "production" for production builds
    entry: "./src/extension.js", // Your main entry point
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js",
        libraryTarget: "commonjs2",
    },
    target: "node", // Target Node.js for VS Code extensions
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"], // Use Babel preset-env
                    },
                },
            },
        ],
    },
    externals: {
        vscode: "commonjs vscode", // Exclude VS Code module
    },
};
