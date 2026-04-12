# Requirements Document

## Introduction

This document specifies the requirements for a Visual Studio Code extension that provides comprehensive language support for Catspeak, a cross-platform scripting language for GameMaker projects. The extension will enable developers to write, navigate, and understand Catspeak code efficiently through syntax highlighting, code navigation, and intelligent code completion features.

## Glossary

- **Extension**: The VSCode extension package that provides Catspeak language support
- **Language_Server**: The language server component that provides semantic analysis and language features
- **Syntax_Highlighter**: The component responsible for tokenizing and colorizing Catspeak source code
- **TextMate_Grammar**: The declarative grammar definition used by VSCode for syntax highlighting
- **Definition_Provider**: The component that resolves symbol definitions for go-to-definition functionality
- **Completion_Provider**: The component that provides IntelliSense suggestions
- **Hover_Provider**: The component that displays information when hovering over symbols
- **Catspeak_File**: A source code file with .meow extension containing Catspeak code
- **Symbol**: A named entity in code such as a variable, function, or keyword
- **Token**: A lexical unit such as a keyword, identifier, operator, or literal
- **Semantic_Analysis**: The process of analyzing code structure and meaning beyond syntax
- **Reference**: A location in code where a symbol is used
- **Declaration**: A location in code where a symbol is defined

## Requirements

### Requirement 1: Syntax Highlighting

**User Story:** As a developer, I want Catspeak code to be syntax highlighted, so that I can quickly distinguish between different language elements and improve code readability.

#### Acceptance Criteria

1. WHEN a Catspeak_File is opened, THE Syntax_Highlighter SHALL tokenize the file content within 100ms
2. THE Syntax_Highlighter SHALL colorize keywords (let, fun, if, else, while, for, return, break, continue, throw, catch, do, match, with, new, self, other, true, false, undefined, infinity, NaN, and, or, xor, impl, params, loop)
3. THE Syntax_Highlighter SHALL colorize string literals enclosed in double quotes with escape sequence support
4. THE Syntax_Highlighter SHALL colorize raw strings prefixed with @ symbol
5. THE Syntax_Highlighter SHALL colorize number literals including decimal, binary (0b prefix), hexadecimal (0x prefix), and underscore separators
6. THE Syntax_Highlighter SHALL colorize colour codes with # prefix (3, 4, 6, or 8 hexadecimal digits)
7. THE Syntax_Highlighter SHALL colorize character literals enclosed in single quotes
8. THE Syntax_Highlighter SHALL colorize comments prefixed with -- until end of line
9. THE Syntax_Highlighter SHALL colorize operators (+, -, *, /, //, %, &, |, ^, <<, >>, <, <=, >, >=, ==, !=, <|, |>, =, +=, -=, *=, /=, !, ~)
10. THE Syntax_Highlighter SHALL colorize identifiers and raw identifiers enclosed in backticks
11. THE Syntax_Highlighter SHALL colorize function calls with distinct styling from regular identifiers

### Requirement 2: File Association

**User Story:** As a developer, I want VSCode to recognize Catspeak files, so that the extension activates automatically when I open them.

#### Acceptance Criteria

1. THE Extension SHALL register .meow as the file extension for Catspeak_File
2. WHEN a file with .meow extension is opened, THE Extension SHALL activate within 200ms
3. THE Extension SHALL associate the language identifier "catspeak" with .meow files
4. THE Extension SHALL provide a language icon for Catspeak_File in the file explorer

### Requirement 3: Go-to-Definition

**User Story:** As a developer, I want to navigate to symbol definitions using Ctrl+Click, so that I can quickly understand code structure and dependencies.

#### Acceptance Criteria

1. WHEN a user Ctrl+Clicks on a Symbol reference, THE Definition_Provider SHALL locate the Declaration within 500ms
2. WHEN a Declaration is found in the same file, THE Definition_Provider SHALL navigate to the Declaration location
3. WHEN a Declaration is found in a different file, THE Definition_Provider SHALL open the file and navigate to the Declaration location
4. WHEN multiple Declarations exist for a Symbol, THE Definition_Provider SHALL display a peek definition widget with all locations
5. IF no Declaration is found for a Symbol, THEN THE Definition_Provider SHALL display a "No definition found" message
6. THE Definition_Provider SHALL resolve Declarations for let statements
7. THE Definition_Provider SHALL resolve Declarations for fun expressions
8. THE Definition_Provider SHALL resolve Declarations for function parameters
9. THE Definition_Provider SHALL resolve Declarations for struct members accessed via dot notation

### Requirement 4: Find All References

**User Story:** As a developer, I want to find all references to a symbol, so that I can understand where and how it is used throughout the codebase.

#### Acceptance Criteria

1. WHEN a user requests find-all-references on a Symbol, THE Language_Server SHALL locate all Reference locations within 1000ms
2. THE Language_Server SHALL display Reference locations in the references panel grouped by file
3. THE Language_Server SHALL include both the Declaration and all Reference locations in the results
4. THE Language_Server SHALL provide file path, line number, and code preview for each Reference
5. WHEN a Reference result is clicked, THE Extension SHALL navigate to that location

### Requirement 5: IntelliSense Code Completion

**User Story:** As a developer, I want intelligent code completion suggestions, so that I can write code faster and with fewer errors.

#### Acceptance Criteria

1. WHEN a user types in a Catspeak_File, THE Completion_Provider SHALL display suggestions within 300ms
2. THE Completion_Provider SHALL suggest Catspeak keywords in appropriate contexts
3. THE Completion_Provider SHALL suggest locally declared variables in scope
4. THE Completion_Provider SHALL suggest function names declared in the current file
5. THE Completion_Provider SHALL suggest struct member names after dot notation
6. THE Completion_Provider SHALL provide snippet completions for common patterns (if-else, while, for, fun)
7. THE Completion_Provider SHALL rank suggestions by relevance with local symbols prioritized over keywords
8. WHEN a completion item is selected, THE Completion_Provider SHALL insert the text at the cursor position
9. THE Completion_Provider SHALL display documentation for completion items when available

### Requirement 6: Hover Information

**User Story:** As a developer, I want to see information about symbols when hovering over them, so that I can understand their purpose without navigating away.

#### Acceptance Criteria

1. WHEN a user hovers over a Symbol for 500ms, THE Hover_Provider SHALL display information in a hover widget
2. THE Hover_Provider SHALL display the Symbol type (variable, function, parameter, keyword)
3. THE Hover_Provider SHALL display the Declaration signature for functions including parameter names
4. THE Hover_Provider SHALL display the value for constant literals
5. THE Hover_Provider SHALL display documentation for built-in keywords
6. THE Hover_Provider SHALL format hover content using markdown
7. IF no information is available for a Symbol, THEN THE Hover_Provider SHALL display nothing

### Requirement 7: Semantic Token Analysis

**User Story:** As a developer, I want accurate semantic highlighting that understands code context, so that I can distinguish between different uses of the same identifier.

#### Acceptance Criteria

1. WHEN Semantic_Analysis completes, THE Language_Server SHALL provide semantic tokens within 1000ms
2. THE Language_Server SHALL classify function declarations differently from function calls
3. THE Language_Server SHALL classify variable declarations differently from variable references
4. THE Language_Server SHALL classify parameters differently from local variables
5. THE Language_Server SHALL classify struct properties differently from regular variables
6. THE Language_Server SHALL update semantic tokens when file content changes

### Requirement 8: Diagnostic Reporting

**User Story:** As a developer, I want to see syntax and semantic errors in real-time, so that I can fix issues as I write code.

#### Acceptance Criteria

1. WHEN a Catspeak_File is edited, THE Language_Server SHALL analyze the file within 500ms
2. THE Language_Server SHALL report syntax errors with line and column positions
3. THE Language_Server SHALL report undefined variable references as warnings
4. THE Language_Server SHALL report unused variable declarations as hints
5. THE Language_Server SHALL display diagnostics in the problems panel
6. THE Language_Server SHALL display error squiggles inline in the editor
7. WHEN a user hovers over a diagnostic, THE Language_Server SHALL display the error message
8. THE Language_Server SHALL clear diagnostics when errors are resolved

### Requirement 9: Document Symbol Outline

**User Story:** As a developer, I want to see an outline of symbols in the current file, so that I can navigate large files efficiently.

#### Acceptance Criteria

1. WHEN a Catspeak_File is opened, THE Language_Server SHALL provide document symbols within 500ms
2. THE Language_Server SHALL list all function declarations in the outline view
3. THE Language_Server SHALL list all let statement declarations in the outline view
4. THE Language_Server SHALL organize symbols hierarchically showing nested scopes
5. THE Language_Server SHALL display symbol icons indicating symbol type (function, variable)
6. WHEN a symbol in the outline is clicked, THE Extension SHALL navigate to that symbol location
7. THE Language_Server SHALL update the outline when file content changes

### Requirement 10: Workspace Symbol Search

**User Story:** As a developer, I want to search for symbols across the entire workspace, so that I can quickly locate definitions in large projects.

#### Acceptance Criteria

1. WHEN a user invokes workspace symbol search, THE Language_Server SHALL search all Catspeak_File instances in the workspace
2. THE Language_Server SHALL return matching symbols within 2000ms
3. THE Language_Server SHALL support fuzzy matching for symbol names
4. THE Language_Server SHALL display file path and symbol type for each result
5. WHEN a search result is selected, THE Extension SHALL open the file and navigate to the symbol location
6. THE Language_Server SHALL index symbols in the background when the workspace is opened

### Requirement 11: Code Formatting

**User Story:** As a developer, I want to automatically format Catspeak code, so that I can maintain consistent code style across the project.

#### Acceptance Criteria

1. WHEN a user invokes format document, THE Extension SHALL format the entire Catspeak_File within 1000ms
2. THE Extension SHALL apply consistent indentation using 2 spaces per level
3. THE Extension SHALL normalize whitespace around operators
4. THE Extension SHALL preserve comment content and position
5. THE Extension SHALL preserve string literal content including escape sequences
6. THE Extension SHALL format multi-line expressions with appropriate line breaks
7. WHEN a user invokes format selection, THE Extension SHALL format only the selected code region

### Requirement 12: Bracket Matching and Auto-Closing

**User Story:** As a developer, I want automatic bracket matching and closing, so that I can write well-formed code with less effort.

#### Acceptance Criteria

1. WHEN a user types an opening bracket character, THE Extension SHALL insert the corresponding closing bracket
2. THE Extension SHALL auto-close parentheses (), square brackets [], and curly braces {}
3. THE Extension SHALL auto-close double quotes " and backticks `
4. WHEN a user types a closing bracket, THE Extension SHALL skip over it if it matches the expected closing bracket
5. THE Extension SHALL highlight matching bracket pairs when the cursor is adjacent to a bracket
6. THE Extension SHALL display a visual indicator for unmatched brackets

### Requirement 13: Comment Toggling

**User Story:** As a developer, I want to quickly comment and uncomment code lines, so that I can temporarily disable code during development.

#### Acceptance Criteria

1. WHEN a user invokes toggle line comment, THE Extension SHALL prefix the current line with -- 
2. WHEN a user invokes toggle line comment on a commented line, THE Extension SHALL remove the -- prefix
3. WHEN multiple lines are selected, THE Extension SHALL toggle comments for all selected lines
4. THE Extension SHALL preserve indentation when toggling comments
5. THE Extension SHALL support the keyboard shortcut Ctrl+/ for toggle line comment

### Requirement 14: Extension Configuration

**User Story:** As a developer, I want to configure extension behavior, so that I can customize the experience to match my workflow.

#### Acceptance Criteria

1. THE Extension SHALL provide a configuration option to enable or disable semantic highlighting
2. THE Extension SHALL provide a configuration option to adjust diagnostic severity levels
3. THE Extension SHALL provide a configuration option to configure formatting style (indent size, spaces vs tabs)
4. THE Extension SHALL provide a configuration option to enable or disable auto-closing brackets
5. THE Extension SHALL apply configuration changes without requiring VSCode restart
6. THE Extension SHALL store configuration in VSCode settings with the "catspeak" namespace

### Requirement 15: Extension Packaging and Distribution

**User Story:** As a developer, I want to easily install the extension, so that I can start using Catspeak language support immediately.

#### Acceptance Criteria

1. THE Extension SHALL be packaged as a .vsix file compatible with VSCode version 1.60.0 or higher
2. THE Extension SHALL include all required dependencies in the package
3. THE Extension SHALL provide installation instructions in the README file
4. THE Extension SHALL declare activation events for .meow files to minimize startup impact
5. THE Extension SHALL include metadata (name, description, version, author, license) in package.json
6. THE Extension SHALL be publishable to the Visual Studio Marketplace
7. THE Extension SHALL include an icon representing the Catspeak language

