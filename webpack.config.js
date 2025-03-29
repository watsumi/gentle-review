const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    popup: "./src/popup.ts",
    content: "./src/content.ts",
    background: "./src/background.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "popup.html", to: "popup.html" },
        { from: "styles.css", to: "styles.css" },
        { from: "icons", to: "icons" },
      ],
    }),
  ],
  devtool: "source-map",
  mode: "development",
};
