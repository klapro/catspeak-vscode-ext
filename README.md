# Catspeak VSCode Extension

Language support for the [Catspeak](https://github.com/katsaii/catspeak-lang) scripting language in Visual Studio Code. Catspeak is a cross-platform scripting language for GameMaker, created by [katsaii](https://github.com/katsaii).

## Features

- Syntax highlighting for .meow files
- IntelliSense code completion
- Go to definition
- Find all references
- Hover information
- Semantic highlighting
- Error diagnostics
- Code formatting
- Bracket matching and auto-closing
- Comment toggling

## Installation

1. Download the .vsix file
2. Open VSCode
3. Go to Extensions view (Ctrl+Shift+X)
4. Click "..." menu and select "Install from VSIX..."
5. Select the downloaded .vsix file

## Configuration

Configure the extension in VSCode settings under the `catspeak` namespace:

- `catspeak.semanticHighlighting`: Enable/disable semantic highlighting
- `catspeak.diagnosticSeverity`: Set diagnostic severity level
- `catspeak.formatting.indentSize`: Number of spaces per indent level
- `catspeak.formatting.useTabs`: Use tabs instead of spaces
- `catspeak.autoClosingBrackets`: Enable/disable auto-closing brackets

## Usage

Open any .meow file and the extension will automatically activate.

## Credits

[Catspeak](https://github.com/katsaii/catspeak-lang) is created and maintained by [katsaii](https://github.com/katsaii). This extension is a community-built tool providing IDE support for the language.

Logo design by [Mashmerlow](https://mashmerlow.art/).

## License

MIT
