const path = require('path');

const clientConfig = {
  target: 'node',
  mode: 'none',
  entry: './client/src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'client/out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'client/tsconfig.json')
            }
          }
        ]
      }
    ]
  }
};

const serverConfig = {
  target: 'node',
  mode: 'none',
  entry: './server/src/server.ts',
  output: {
    path: path.resolve(__dirname, 'server/out'),
    filename: 'server.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'server/tsconfig.json')
            }
          }
        ]
      }
    ]
  }
};

module.exports = [clientConfig, serverConfig];
