# Implementation Plan: Catspeak VSCode Extension

## Overview

This implementation plan breaks down the Catspeak VSCode extension into sequential, incremental tasks. The extension provides comprehensive language support for Catspeak (.meow files) including syntax highlighting, language server features (LSP), code navigation, IntelliSense, diagnostics, and formatting. The architecture consists of a client-side extension and a Node.js-based language server communicating via the Language Server Protocol.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create directory structure: client/, server/, syntaxes/, test/
  - Initialize package.json for extension with VSCode extension metadata
  - Initialize package.json for client and server workspaces
  - Install dependencies: vscode-languageclient, vscode-languageserver, vscode-languageserver-textdocument
  - Configure TypeScript compilation for both client and server
  - Set up build scripts and webpack bundling configuration
  - _Requirements: 15.1, 15.2, 15.5_

- [x] 2. Implement TextMate grammar for syntax highlighting
  - [x] 2.1 Create catspeak.tmLanguage.json grammar file
    - Define scopeName and file type associations
    - Implement keyword tokenization patterns (let, fun, if, else, while, for, return, break, continue, etc.)
    - Implement string literal patterns with escape sequence support
    - Implement raw string patterns with @ prefix
    - Implement number literal patterns (decimal, binary 0b, hexadecimal 0x, underscore separators)
    - Implement colour code patterns with # prefix (3, 4, 6, 8 hex digits)
    - Implement character literal patterns with single quotes
    - Implement comment patterns with -- prefix
    - Implement operator tokenization patterns
    - Implement identifier and raw identifier (backtick) patterns
    - Implement function call detection patterns
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_
  
  - [x] 2.2 Register TextMate grammar in extension client
    - Register grammar in package.json contributes.grammars section
    - Associate .meow file extension with catspeak language
    - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [x] 3. Implement extension client activation and configuration
  - [x] 3.1 Create extension.ts with activation logic
    - Implement activate() function that triggers on .meow file open
    - Implement deactivate() function for cleanup
    - Register activation events in package.json
    - _Requirements: 2.2, 15.4_
  
  - [x] 3.2 Implement configuration manager
    - Define CatspeakConfiguration interface with semantic highlighting, diagnostic severity, formatting, and auto-closing options
    - Implement getConfiguration() to read from VSCode settings
    - Implement onConfigurationChanged() event handler
    - Register configuration schema in package.json contributes.configuration
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [x] 3.3 Implement language client manager
    - Create LanguageClientManager class to manage server lifecycle
    - Implement startServer() to spawn language server process
    - Implement stopServer() and restartServer() methods
    - Configure LSP client options and server options
    - _Requirements: 2.2_

- [x] 4. Implement Catspeak parser
  - [x] 4.1 Create lexer for tokenization
    - Implement token types: Keyword, Identifier, String, Number, Operator, Comment, Punctuation
    - Implement tokenize() function to convert source to token stream
    - Handle all Catspeak literals: strings, raw strings, numbers, colours, characters
    - Handle operators and punctuation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_
  
  - [x] 4.2 Create AST node definitions
    - Define ASTNode interface with type, range, and children
    - Define node types: Program, LetDeclaration, FunctionExpression, CallExpression, BinaryExpression, Identifier, Literal, IfStatement, WhileStatement, ReturnStatement, MemberExpression
    - Define ParseResult interface with ast, errors, and tokens
    - _Requirements: 3.6, 3.7, 3.8, 3.9_
  
  - [x] 4.3 Implement recursive descent parser
    - Implement parse() function to build AST from tokens
    - Implement parsing for let declarations
    - Implement parsing for fun expressions with parameters
    - Implement parsing for expressions: binary, call, member access
    - Implement parsing for statements: if, while, for, return, break, continue
    - Implement error recovery using synchronization tokens
    - _Requirements: 3.6, 3.7, 3.8, 3.9, 8.2_
  
  - [ ]* 4.4 Write unit tests for parser
    - Test parsing valid function declarations
    - Test parsing let statements
    - Test parsing expressions and operators
    - Test parsing control flow statements
    - Test error recovery for invalid syntax
    - _Requirements: 8.2_

- [x] 5. Checkpoint - Ensure parser tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement semantic analyzer
  - [x] 6.1 Create symbol table and scope management
    - Define Symbol interface with name, kind, range, declarationRange, type, documentation
    - Define SymbolKind enum: Variable, Function, Parameter, Property, Keyword
    - Define Scope interface with range, parent, and symbols map
    - Implement scope hierarchy building from AST
    - _Requirements: 3.6, 3.7, 3.8, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 6.2 Implement symbol collection and resolution
    - Implement analyze() function to traverse AST and collect symbols
    - Collect symbols from let declarations
    - Collect symbols from fun expressions and parameters
    - Collect symbols from struct member access
    - Implement getSymbolAtPosition() for position-based lookups
    - Implement reference resolution by searching enclosing scopes
    - _Requirements: 3.6, 3.7, 3.8, 3.9, 7.2, 7.3, 7.4_
  
  - [x] 6.3 Implement diagnostic generation
    - Generate syntax error diagnostics from parse errors
    - Generate undefined variable reference warnings
    - Generate unused variable declaration hints
    - Create Diagnostic objects with range, severity, message, and source
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 6.4 Write unit tests for semantic analyzer
    - Test symbol resolution within nested scopes
    - Test undefined variable detection
    - Test unused variable detection
    - Test parameter symbol collection
    - _Requirements: 8.3, 8.4_

- [x] 7. Implement symbol index for workspace-wide search
  - [x] 7.1 Create SymbolIndex class
    - Implement indexDocument() to add symbols from a document
    - Implement removeDocument() to remove symbols when document closes
    - Implement getDocumentSymbols() to retrieve symbols for a specific document
    - Implement getAllSymbols() to retrieve all indexed symbols
    - _Requirements: 10.1, 10.6_
  
  - [x] 7.2 Implement symbol search with fuzzy matching
    - Implement findSymbol() for exact name matching
    - Implement findSymbolFuzzy() using fuzzy matching algorithm
    - Return Symbol[] with file path and symbol type
    - _Requirements: 10.2, 10.3, 10.4_
  
  - [ ]* 7.3 Write unit tests for symbol index
    - Test indexing and retrieval operations
    - Test fuzzy matching with typos
    - Test document removal
    - _Requirements: 10.3_

- [x] 8. Implement language server core
  - [x] 8.1 Create server.ts with LSP connection setup
    - Initialize LSP connection using createConnection()
    - Set up document manager using TextDocuments
    - Implement document synchronization handlers: onDidOpenTextDocument, onDidChangeTextDocument, onDidCloseTextDocument
    - Maintain DocumentState map with uri, version, content, parseResult, analysisResult
    - _Requirements: 2.2, 8.1_
  
  - [x] 8.2 Implement document analysis pipeline
    - On document open/change: tokenize, parse, analyze, and index
    - Debounce analysis by 300ms after typing stops
    - Cache parse results and analysis results
    - Publish diagnostics after analysis completes
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7, 8.8_
  
  - [x] 8.3 Implement server initialization and capabilities
    - Implement onInitialize handler to declare server capabilities
    - Declare support for: completion, hover, definition, references, documentSymbol, workspaceSymbol, semanticTokens, diagnostics
    - Handle configuration from client
    - _Requirements: 2.2_

- [x] 9. Implement LSP language features
  - [x] 9.1 Implement go-to-definition provider
    - Implement onDefinition handler
    - Use getSymbolAtPosition() to find symbol at cursor
    - Return Location with uri and range of declaration
    - Handle multiple definitions with Location[]
    - Return null if no definition found
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_
  
  - [x] 9.2 Implement find-all-references provider
    - Implement onReferences handler
    - Use getReferences() from semantic analyzer
    - Return Location[] with all reference locations
    - Include declaration location in results
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 9.3 Implement hover provider
    - Implement onHover handler
    - Use getSymbolAtPosition() to find symbol at cursor
    - Format hover content with symbol type, signature, and documentation
    - Return Hover with markdown content
    - Return null if no information available
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 9.4 Implement completion provider
    - Implement onCompletion handler
    - Use getCompletions() from semantic analyzer
    - Suggest keywords in appropriate contexts
    - Suggest local variables, functions, and parameters in scope
    - Suggest struct members after dot notation
    - Rank suggestions: exact match > local > document > workspace > keywords
    - Return CompletionItem[] with label, kind, detail, documentation, insertText
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_
  
  - [x] 9.5 Implement document symbol provider
    - Implement onDocumentSymbol handler
    - Extract symbols from current document's analysis result
    - Return DocumentSymbol[] with name, kind, range, selectionRange, and children for nested scopes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [x] 9.6 Implement workspace symbol provider
    - Implement onWorkspaceSymbol handler
    - Use symbol index findSymbolFuzzy() for query matching
    - Return SymbolInformation[] with name, kind, location, and containerName
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 9.7 Implement semantic tokens provider
    - Implement onSemanticTokensFull handler
    - Generate semantic tokens from analysis result
    - Classify tokens by type: namespace, class, function, variable, parameter, property, keyword, comment, string, number
    - Return SemanticTokens with encoded token data
    - Implement onSemanticTokensRange for visible range only
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 10. Checkpoint - Ensure language features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement client-side editor features
  - [x] 11.1 Implement bracket matching and auto-closing
    - Register bracket pairs in package.json: (), [], {}, "", ``
    - Configure auto-closing behavior in language configuration
    - Configure bracket matching highlighting
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [x] 11.2 Implement comment toggling
    - Register line comment pattern in language configuration: --
    - Configure comment toggling to preserve indentation
    - Register Ctrl+/ keyboard shortcut
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [x] 11.3 Implement code formatting
    - Implement document formatting provider in client or server
    - Apply consistent indentation (2 spaces per level)
    - Normalize whitespace around operators
    - Preserve comments and string literals
    - Handle multi-line expressions
    - Support format document and format selection
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 12. Implement extension packaging and metadata
  - [x] 12.1 Configure package.json metadata
    - Set name, displayName, description, version, publisher
    - Set engines.vscode to ^1.60.0
    - Add icon.png file and reference in package.json
    - Add categories: Programming Languages
    - Add keywords: catspeak, gamemaker, scripting
    - Set license field
    - _Requirements: 15.1, 15.5, 15.7_
  
  - [x] 12.2 Create README.md with installation and usage instructions
    - Document extension features
    - Provide installation instructions
    - Document configuration options
    - Include code examples
    - _Requirements: 15.3_
  
  - [x] 12.3 Create CHANGELOG.md and LICENSE files
    - Document initial release version
    - Add license text
    - _Requirements: 15.5_
  
  - [x] 12.4 Configure build and packaging scripts
    - Add vsce as dev dependency
    - Create build script to compile TypeScript and bundle with webpack
    - Create package script to generate .vsix file
    - Add pre-publish validation
    - _Requirements: 15.1, 15.2, 15.6_

- [ ] 13. Integration testing and validation
  - [ ]* 13.1 Write integration tests for extension activation
    - Test extension activates on .meow file open within 200ms
    - Test language server starts successfully
    - Test document synchronization
    - _Requirements: 2.2_
  
  - [ ]* 13.2 Write integration tests for language features
    - Test completion appears within 300ms
    - Test go-to-definition navigation
    - Test find-all-references results
    - Test hover information display
    - Test diagnostics appear within 500ms
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 8.1_
  
  - [ ]* 13.3 Write integration tests for configuration
    - Test configuration changes propagate to server
    - Test semantic highlighting toggle
    - Test formatting configuration
    - _Requirements: 14.5_

- [x] 14. Final checkpoint and package validation
  - Ensure all tests pass, ask the user if questions arise.
  - Validate .vsix package contents
  - Test manual installation from .vsix file
  - Verify all features work in clean VSCode instance

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation follows a bottom-up approach: parser → analyzer → language server → client features
- Checkpoints ensure incremental validation at key milestones
- TypeScript is used throughout for type safety and VSCode API compatibility
- The extension uses the Language Server Protocol for separation of concerns and performance
