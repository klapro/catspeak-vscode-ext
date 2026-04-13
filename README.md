# Catspeak

Language support for the [Catspeak](https://github.com/katsaii/catspeak-lang) scripting language in Visual Studio Code. Catspeak is a cross-platform scripting language for GameMaker, created by [katsaii](https://github.com/katsaii).

## Features

- Syntax highlighting for .meow files
- IntelliSense code completion with GML builtins and project definitions
- Go to definition and find all references
- Hover information with doc comments (`--` comments above declarations)
- 2600+ GML built-in functions, variables, and constants recognized
- Project config to define your game's custom globals and functions
- Import API definitions from YAML/JSON files
- Struct literal support (`{ key: value }` syntax)
- Multi-line string concatenation
- Semantic highlighting
- Real-time error diagnostics
- Code formatting
- Bracket matching and auto-closing
- Comment toggling
- Status bar indicator for project config

## Configuration

Configure the extension in VSCode settings under the `catspeak` namespace:

- `catspeak.semanticHighlighting`: Enable/disable semantic highlighting
- `catspeak.diagnosticSeverity`: Set diagnostic severity level
- `catspeak.formatting.indentSize`: Number of spaces per indent level
- `catspeak.formatting.useTabs`: Use tabs instead of spaces
- `catspeak.autoClosingBrackets`: Enable/disable auto-closing brackets

## Project Config

Define your game's custom globals and functions so the extension recognizes them. A status bar item at the bottom shows the config status — click it to open or create the config.

Run `Catspeak: Init Project Config` from the command palette to scaffold a `catspeak.config.json`:

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

The `import` field supports YAML and JSON files with an OpenAPI-style structure. GML built-in names are automatically skipped from imports. Descriptions and examples from the imported file are shown in hover tooltips.

After editing the config, run `Catspeak: Restart Language Server` to reload.

## Commands

- `Catspeak: Init Project Config` — Create a catspeak.config.json
- `Catspeak: Restart Language Server` — Reload the language server

## Credits

[Catspeak](https://github.com/katsaii/catspeak-lang) is created and maintained by [katsaii](https://github.com/katsaii). This extension is a community-built tool providing IDE support for the language.

Logo design by [Mashmerlow](https://mashmerlow.art/).

## License

MIT
