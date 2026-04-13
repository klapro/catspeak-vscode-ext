# Catspeak

Language support for the [Catspeak](https://github.com/katsaii/catspeak-lang) scripting language in Visual Studio Code. Catspeak is a cross-platform scripting language for GameMaker, created by [katsaii](https://github.com/katsaii).

## Features

- Syntax highlighting for .meow files
- IntelliSense code completion
- Go to definition
- Find all references
- Hover information with doc comments
- GML built-in function documentation
- Semantic highlighting
- Error diagnostics
- Code formatting
- Bracket matching and auto-closing
- Comment toggling

## Configuration

Configure the extension in VSCode settings under the `catspeak` namespace:

- `catspeak.semanticHighlighting`: Enable/disable semantic highlighting
- `catspeak.diagnosticSeverity`: Set diagnostic severity level
- `catspeak.formatting.indentSize`: Number of spaces per indent level
- `catspeak.formatting.useTabs`: Use tabs instead of spaces
- `catspeak.autoClosingBrackets`: Enable/disable auto-closing brackets

## Usage

Open any `.meow` file and the extension will automatically activate.

## Project Config

Define your game's custom globals and functions so the extension recognizes them.

Run `Catspeak: Init Project Config` from the command palette to create a `catspeak.config.json` in your workspace. You can also import from a YAML/JSON API file:

```json
{
  "import": "path/to/your_game_api.yaml",
  "globals": [
    { "name": "global.money", "type": "Real", "description": "Player money" }
  ],
  "functions": [
    { "name": "mods_notify", "params": ["message"], "returns": "void", "description": "Show notification" }
  ],
  "knownNames": ["my_custom_var"]
}
```

GML built-in names are automatically skipped from imports.

## Credits

[Catspeak](https://github.com/katsaii/catspeak-lang) is created and maintained by [katsaii](https://github.com/katsaii). This extension is a community-built tool providing IDE support for the language.

Logo design by [Mashmerlow](https://mashmerlow.art/).

## License

MIT
