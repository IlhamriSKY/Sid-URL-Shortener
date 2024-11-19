const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    target: 'node',
    mode: 'production',
    entry: './src/extension.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.bundle.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode',
        ...nodeExternals(),
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,  // Add rule to handle .js files
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    devtool: 'source-map'
};
