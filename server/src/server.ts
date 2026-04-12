/**
 * Catspeak Language Server — LSP connection, document synchronization,
 * and per-document state management.
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  Diagnostic as LspDiagnostic,
  DiagnosticSeverity as LspDiagnosticSeverity,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  Location,
  Hover,
  MarkupKind,
  CompletionItem as LspCompletionItem,
  CompletionItemKind as LspCompletionItemKind,
  DocumentSymbol,
  SymbolKind as LspSymbolKind,
  SymbolInformation,
  SemanticTokens,
  SemanticTokensBuilder,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { parse } from './parser';
import {
  analyze,
  AnalysisResult,
  Diagnostic,
  DiagnosticSeverity,
  getSymbolAtPositionWithAST,
  getReferences,
  getCompletions,
  CompletionItemKind as AnalyzerCompletionItemKind,
  SymbolKind as AnalyzerSymbolKind,
  CatspeakSymbol,
  SemanticToken,
} from './analyzer';
import { SymbolIndex, IndexedSymbol } from './symbolIndex';
import { ParseResult, FunctionExpressionNode, LetDeclarationNode, IdentifierNode, MemberExpressionNode, ASTNode, ProgramNode } from './ast';
import { formatDocument, formatRange } from './formatter';
import { GML_BUILTINS, formatGmlHover } from './gmlBuiltins';

// ---- Document State ----

export interface DocumentState {
  uri: string;
  version: number;
  content: string;
  parseResult: ParseResult;
  analysisResult: AnalysisResult;
}

// ---- State ----

export const documentStates = new Map<string, DocumentState>();
export const symbolIndex = new SymbolIndex();

// ---- Connection & Document Manager ----

export const connection = createConnection(ProposedFeatures.all);
export const documents = new TextDocuments<TextDocument>(TextDocument);

// ---- Debounce Timers ----

/** Timers keyed by document URI for debouncing analysis on content changes. */
export const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Debounce delay in milliseconds. */
export const DEBOUNCE_MS = 300;

// ---- Document Synchronization ----

/**
 * Analyze a document: parse, run semantic analysis, update state and index.
 * Publishes LSP diagnostics to the client after analysis completes.
 */
export function analyzeDocument(uri: string, version: number, content: string): DocumentState {
  const parseResult = parse(content);
  const analysisResult = analyze(parseResult.ast, parseResult.errors, parseResult.tokens);

  const state: DocumentState = {
    uri,
    version,
    content,
    parseResult,
    analysisResult,
  };

  documentStates.set(uri, state);

  // Update the symbol index with symbols from this document
  const symbols = Array.from(analysisResult.symbols.symbols.values());
  symbolIndex.indexDocument(uri, symbols);

  // Publish diagnostics to the client
  publishDiagnostics(uri, analysisResult.diagnostics);

  return state;
}

/**
 * Convert analyzer diagnostics to LSP diagnostics and send them to the client.
 */
export function publishDiagnostics(uri: string, diagnostics: Diagnostic[]): void {
  const lspDiagnostics: LspDiagnostic[] = diagnostics.map(convertDiagnostic);
  connection.sendDiagnostics({ uri, diagnostics: lspDiagnostics });
}

/**
 * Convert an analyzer Diagnostic to an LSP Diagnostic.
 */
function convertDiagnostic(diag: Diagnostic): LspDiagnostic {
  return {
    range: {
      start: { line: diag.range.start.line, character: diag.range.start.character },
      end: { line: diag.range.end.line, character: diag.range.end.character },
    },
    severity: convertSeverity(diag.severity),
    message: diag.message,
    source: diag.source,
    ...(diag.code !== undefined ? { code: diag.code } : {}),
  };
}

/**
 * Convert analyzer DiagnosticSeverity to LSP DiagnosticSeverity.
 */
function convertSeverity(severity: DiagnosticSeverity): LspDiagnosticSeverity {
  switch (severity) {
    case DiagnosticSeverity.Error: return LspDiagnosticSeverity.Error;
    case DiagnosticSeverity.Warning: return LspDiagnosticSeverity.Warning;
    case DiagnosticSeverity.Information: return LspDiagnosticSeverity.Information;
    case DiagnosticSeverity.Hint: return LspDiagnosticSeverity.Hint;
    default: return LspDiagnosticSeverity.Error;
  }
}

// Analyze immediately on document open (no debounce)
documents.onDidOpen((event) => {
  const { uri, version } = event.document;
  const content = event.document.getText();
  analyzeDocument(uri, version, content);
});

// Debounce analysis on content changes (300ms after typing stops)
documents.onDidChangeContent((event) => {
  const { uri, version } = event.document;
  const content = event.document.getText();

  // Clear any existing debounce timer for this document
  const existing = debounceTimers.get(uri);
  if (existing !== undefined) {
    clearTimeout(existing);
  }

  // Set a new timer — analysis runs after DEBOUNCE_MS of inactivity
  const timer = setTimeout(() => {
    debounceTimers.delete(uri);
    analyzeDocument(uri, version, content);
  }, DEBOUNCE_MS);

  debounceTimers.set(uri, timer);
});

documents.onDidClose((event) => {
  const { uri } = event.document;

  // Clear any pending debounce timer
  const existing = debounceTimers.get(uri);
  if (existing !== undefined) {
    clearTimeout(existing);
    debounceTimers.delete(uri);
  }

  documentStates.delete(uri);
  symbolIndex.removeDocument(uri);

  // Clear diagnostics for the closed document
  connection.sendDiagnostics({ uri, diagnostics: [] });
});

// ---- Semantic Token Legend ----

export const semanticTokenTypes = [
  'namespace',
  'class',
  'function',
  'variable',
  'parameter',
  'property',
  'keyword',
  'comment',
  'string',
  'number',
];

export const semanticTokenModifiers = [
  'declaration',
  'definition',
  'readonly',
];

// ---- Server Initialization ----

/** Whether the client supports workspace configuration requests. */
let hasConfigurationCapability = false;

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const capabilities = params.capabilities;

  // Check if the client supports workspace/configuration requests
  hasConfigurationCapability = !!(
    capabilities.workspace && capabilities.workspace.configuration
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: {
        triggerCharacters: ['.'],
      },
      hoverProvider: true,
      definitionProvider: true,
      referencesProvider: true,
      documentSymbolProvider: true,
      workspaceSymbolProvider: true,
      semanticTokensProvider: {
        legend: {
          tokenTypes: semanticTokenTypes,
          tokenModifiers: semanticTokenModifiers,
        },
        full: true,
        range: true,
      },
      documentFormattingProvider: true,
      documentRangeFormattingProvider: true,
    },
  };

  return result;
});

// ---- LSP Language Feature Handlers ----

// 9.1 Go-to-definition provider
connection.onDefinition((params) => {
  const state = documentStates.get(params.textDocument.uri);
  if (!state) return null;

  const { line, character } = params.position;
  const symbol = getSymbolAtPositionWithAST(
    state.parseResult.ast,
    state.analysisResult,
    line,
    character,
  );
  if (!symbol) return null;

  return Location.create(state.uri, {
    start: { line: symbol.declarationRange.start.line, character: symbol.declarationRange.start.character },
    end: { line: symbol.declarationRange.end.line, character: symbol.declarationRange.end.character },
  });
});

// 9.2 Find-all-references provider
connection.onReferences((params) => {
  const state = documentStates.get(params.textDocument.uri);
  if (!state) return [];

  const { line, character } = params.position;
  const ranges = getReferences(
    state.parseResult.ast,
    state.analysisResult,
    line,
    character,
  );

  return ranges.map((range) =>
    Location.create(params.textDocument.uri, {
      start: { line: range.start.line, character: range.start.character },
      end: { line: range.end.line, character: range.end.character },
    }),
  );
});

// 9.3 Hover provider
connection.onHover((params) => {
  const state = documentStates.get(params.textDocument.uri);
  if (!state) return null;

  const { line, character } = params.position;
  const symbol = getSymbolAtPositionWithAST(
    state.parseResult.ast,
    state.analysisResult,
    line,
    character,
  );

  if (symbol) {
    const content = formatHoverContent(symbol, state);
    if (!content) return null;
    return { contents: { kind: MarkupKind.Markdown, value: content } } as Hover;
  }

  // No local symbol found — check if it's a GML builtin
  const idNode = findIdentifierAtPositionFromAST(state.parseResult.ast, line, character);
  if (idNode) {
    const builtin = GML_BUILTINS.get(idNode);
    if (builtin) {
      return { contents: { kind: MarkupKind.Markdown, value: formatGmlHover(builtin) } } as Hover;
    }
  }

  return null;
});

/**
 * Find the identifier name at a position by walking the AST.
 */
function findIdentifierAtPositionFromAST(ast: ProgramNode, line: number, character: number): string | null {
  function walk(node: ASTNode): string | null {
    if (node.type === 'Identifier') {
      const id = node as IdentifierNode;
      if (line >= id.range.start.line && line <= id.range.end.line &&
          character >= id.range.start.character && character <= id.range.end.character) {
        return id.name;
      }
      return null;
    }
    if (node.type === 'MemberExpression') {
      const m = node as MemberExpressionNode;
      const prop = walk(m.property);
      if (prop) return prop;
      return walk(m.object);
    }
    for (const child of node.children) {
      const result = walk(child);
      if (result) return result;
    }
    return null;
  }
  return walk(ast);
}

/**
 * Format hover content for a symbol as markdown.
 */
function formatHoverContent(symbol: CatspeakSymbol, state: DocumentState): string | null {
  let md = '';

  switch (symbol.kind) {
    case 'Function': {
      const paramNames = findFunctionParams(symbol, state);
      const params = paramNames ? paramNames.join(', ') : '';
      md = `\`\`\`catspeak\nfun ${symbol.name}(${params})\n\`\`\``;
      break;
    }
    case 'Variable': {
      if (symbol.type) {
        md = `\`\`\`catspeak\nlet ${symbol.name}: ${symbol.type}\n\`\`\``;
      } else {
        md = `\`\`\`catspeak\nlet ${symbol.name}\n\`\`\``;
      }
      break;
    }
    case 'Parameter':
      md = `\`\`\`catspeak\nparameter ${symbol.name}\n\`\`\``;
      break;
    default:
      md = `\`\`\`catspeak\n${symbol.kind.toLowerCase()} ${symbol.name}\n\`\`\``;
      break;
  }

  if (symbol.documentation) {
    md += '\n\n' + symbol.documentation;
  }

  return md;
}

/**
 * Find function parameter names from the AST for a function symbol.
 */
function findFunctionParams(symbol: CatspeakSymbol, state: DocumentState): string[] | null {
  // Walk the AST to find the LetDeclaration whose value is a FunctionExpression
  for (const stmt of state.parseResult.ast.body) {
    if (stmt.type === 'LetDeclaration') {
      const letNode = stmt as LetDeclarationNode;
      if (letNode.name.name === symbol.name && letNode.value?.type === 'FunctionExpression') {
        const fnNode = letNode.value as FunctionExpressionNode;
        return fnNode.params.map((p) => p.name);
      }
    }
  }
  return null;
}

// 9.4 Completion provider
connection.onCompletion((params) => {
  const state = documentStates.get(params.textDocument.uri);
  if (!state) return [];

  const { line, character } = params.position;
  const items = getCompletions(state.analysisResult, line, character);

  const result: LspCompletionItem[] = items.map((item): LspCompletionItem => ({
    label: item.label,
    kind: mapCompletionItemKind(item.kind),
    detail: item.detail,
    documentation: item.documentation,
    insertText: item.insertText,
    sortText: item.sortText,
  }));

  // Add GML builtins that aren't already in the list
  const seen = new Set(items.map(i => i.label));
  for (const [name, builtin] of GML_BUILTINS) {
    if (!seen.has(name)) {
      result.push({
        label: name,
        kind: LspCompletionItemKind.Function,
        detail: `(GML) ${builtin.signature}`,
        documentation: builtin.description,
        sortText: '50' + name,
      });
    }
  }

  return result;
});

/**
 * Map analyzer CompletionItemKind to LSP CompletionItemKind.
 */
function mapCompletionItemKind(kind: AnalyzerCompletionItemKind): LspCompletionItemKind {
  switch (kind) {
    case AnalyzerCompletionItemKind.Function: return LspCompletionItemKind.Function;
    case AnalyzerCompletionItemKind.Variable: return LspCompletionItemKind.Variable;
    case AnalyzerCompletionItemKind.Property: return LspCompletionItemKind.Property;
    case AnalyzerCompletionItemKind.Keyword: return LspCompletionItemKind.Keyword;
    case AnalyzerCompletionItemKind.Snippet: return LspCompletionItemKind.Snippet;
    default: return LspCompletionItemKind.Text;
  }
}

// 9.5 Document symbol provider
connection.onDocumentSymbol((params) => {
  const state = documentStates.get(params.textDocument.uri);
  if (!state) return [];

  const symbols = Array.from(state.analysisResult.symbols.symbols.values());
  return symbols.map((sym): DocumentSymbol => ({
    name: sym.name,
    kind: mapSymbolKind(sym.kind),
    range: {
      start: { line: sym.declarationRange.start.line, character: sym.declarationRange.start.character },
      end: { line: sym.declarationRange.end.line, character: sym.declarationRange.end.character },
    },
    selectionRange: {
      start: { line: sym.range.start.line, character: sym.range.start.character },
      end: { line: sym.range.end.line, character: sym.range.end.character },
    },
  }));
});

/**
 * Map analyzer SymbolKind to LSP SymbolKind.
 */
function mapSymbolKind(kind: AnalyzerSymbolKind): LspSymbolKind {
  switch (kind) {
    case 'Function': return LspSymbolKind.Function;
    case 'Variable': return LspSymbolKind.Variable;
    case 'Parameter': return LspSymbolKind.Variable;
    case 'Property': return LspSymbolKind.Property;
    case 'Keyword': return LspSymbolKind.Constant;
    default: return LspSymbolKind.Variable;
  }
}

// 9.6 Workspace symbol provider
connection.onWorkspaceSymbol((params) => {
  const query = params.query;
  const results = symbolIndex.findSymbolFuzzy(query);

  return results.map((sym: IndexedSymbol): SymbolInformation => ({
    name: sym.name,
    kind: mapSymbolKind(sym.kind),
    location: Location.create(sym.documentUri, {
      start: { line: sym.range.start.line, character: sym.range.start.character },
      end: { line: sym.range.end.line, character: sym.range.end.character },
    }),
    containerName: undefined,
  }));
});

// 9.7 Semantic tokens provider — full document
connection.languages.semanticTokens.on((params) => {
  const state = documentStates.get(params.textDocument.uri);
  if (!state) return { data: [] };

  return buildSemanticTokens(state.analysisResult.semanticTokens);
});

// 9.7 Semantic tokens provider — range
connection.languages.semanticTokens.onRange((params) => {
  const state = documentStates.get(params.textDocument.uri);
  if (!state) return { data: [] };

  const { start, end } = params.range;
  const filtered = state.analysisResult.semanticTokens.filter((t) =>
    t.line >= start.line && t.line <= end.line,
  );

  return buildSemanticTokens(filtered);
});

/**
 * Build SemanticTokens from an array of analyzer SemanticToken objects.
 * Tokens must be sorted by line then character, and encoded as deltas.
 */
function buildSemanticTokens(tokens: SemanticToken[]): SemanticTokens {
  // Sort tokens by line, then character
  const sorted = [...tokens].sort((a, b) =>
    a.line !== b.line ? a.line - b.line : a.character - b.character,
  );

  const builder = new SemanticTokensBuilder();

  for (const token of sorted) {
    const typeIndex = semanticTokenTypes.indexOf(token.tokenType);
    if (typeIndex === -1) continue;

    let modifierBits = 0;
    if (token.tokenModifiers) {
      for (const mod of token.tokenModifiers) {
        const modIndex = semanticTokenModifiers.indexOf(mod);
        if (modIndex !== -1) {
          modifierBits |= 1 << modIndex;
        }
      }
    }

    builder.push(token.line, token.character, token.length, typeIndex, modifierBits);
  }

  return builder.build();
}

// 11.3 Document formatting provider
connection.onDocumentFormatting((params) => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];

  const source = doc.getText();
  const formatted = formatDocument(source, {
    indentSize: params.options.tabSize ?? 2,
    useTabs: params.options.insertSpaces === false,
  });

  // Replace the entire document
  const lastLine = doc.lineCount - 1;
  const lastChar = doc.getText().length;
  return [{
    range: {
      start: { line: 0, character: 0 },
      end: doc.positionAt(lastChar),
    },
    newText: formatted,
  }];
});

// 11.3 Document range formatting provider
connection.onDocumentRangeFormatting((params) => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];

  const source = doc.getText();
  const startLine = params.range.start.line;
  const endLine = params.range.end.line;

  const formatted = formatRange(source, startLine, endLine, {
    indentSize: params.options.tabSize ?? 2,
    useTabs: params.options.insertSpaces === false,
  });

  // Replace the selected range (full lines)
  const startOffset = doc.offsetAt({ line: startLine, character: 0 });
  const endOffset = doc.offsetAt({ line: endLine + 1, character: 0 });
  const endPos = doc.positionAt(endOffset);

  return [{
    range: {
      start: { line: startLine, character: 0 },
      end: endPos,
    },
    newText: formatted,
  }];
});

// Wire the document manager to the connection
documents.listen(connection);

// Start listening
connection.listen();
