/**
 * Catspeak Semantic Analyzer - Symbol table, scope management, and analysis.
 */

import { Range, Position } from './lexer';
import { GML_BUILTINS } from './gmlBuiltins';
import { GML_ALL_NAMES } from './gmlNames';
import {
  ASTNode,
  ProgramNode,
  LetDeclarationNode,
  FunctionExpressionNode,
  BlockExpressionNode,
  ForStatementNode,
  IfStatementNode,
  WhileStatementNode,
  IdentifierNode,
  MemberExpressionNode,
  AssignmentExpressionNode,
  ExpressionStatementNode,
  ParseError,
} from './ast';

// ---- Symbol and Scope Types ----

export type SymbolKind = 'Variable' | 'Function' | 'Parameter' | 'Property' | 'Keyword';

export interface CatspeakSymbol {
  name: string;
  kind: SymbolKind;
  range: Range;
  declarationRange: Range;
  type?: string;
  documentation?: string;
}

export interface Scope {
  range: Range;
  parent: Scope | null;
  symbols: Map<string, CatspeakSymbol>;
}

export interface SymbolTable {
  symbols: Map<string, CatspeakSymbol>;
  scopes: Scope[];
}

// ---- Analysis Result Types ----

export interface SemanticToken {
  line: number;
  character: number;
  length: number;
  tokenType: string;
  tokenModifiers?: string[];
}

export interface Diagnostic {
  range: Range;
  severity: DiagnosticSeverity;
  message: string;
  code?: string;
  source: string;
}

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export interface AnalysisResult {
  symbols: SymbolTable;
  diagnostics: Diagnostic[];
  semanticTokens: SemanticToken[];
}

export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
}

export enum CompletionItemKind {
  Function = 3,
  Variable = 6,
  Property = 10,
  Keyword = 14,
  Snippet = 15,
}

/** A reference to a symbol at a specific location. */
export interface SymbolReference {
  name: string;
  range: Range;
  isDeclaration: boolean;
  isProperty?: boolean;
}

// ---- Scope Hierarchy Building ----

/**
 * Build a scope hierarchy from a parsed AST.
 * Creates nested scopes for blocks, functions, for-loops, etc.
 * Does NOT collect symbols — that is handled by task 6.2.
 */
export function buildScopeHierarchy(ast: ProgramNode): Scope[] {
  const scopes: Scope[] = [];

  function createScope(range: Range, parent: Scope | null): Scope {
    const scope: Scope = { range, parent, symbols: new Map() };
    scopes.push(scope);
    return scope;
  }

  function visit(node: ASTNode, currentScope: Scope): void {
    switch (node.type) {
      case 'FunctionExpression': {
        const fn = node as FunctionExpressionNode;
        const fnScope = createScope(fn.range, currentScope);
        // Visit params and body within the function scope
        for (const param of fn.params) {
          visit(param, fnScope);
        }
        visit(fn.body, fnScope);
        break;
      }

      case 'BlockExpression': {
        const block = node as BlockExpressionNode;
        const blockScope = createScope(block.range, currentScope);
        for (const stmt of block.body) {
          visit(stmt, blockScope);
        }
        break;
      }

      case 'ForStatement': {
        const forStmt = node as ForStatementNode;
        const forScope = createScope(forStmt.range, currentScope);
        visit(forStmt.variable, forScope);
        visit(forStmt.iterable, forScope);
        visit(forStmt.body, forScope);
        break;
      }

      case 'IfStatement': {
        const ifStmt = node as IfStatementNode;
        visit(ifStmt.condition, currentScope);
        visit(ifStmt.consequent, currentScope);
        if (ifStmt.alternate) {
          visit(ifStmt.alternate, currentScope);
        }
        break;
      }

      case 'WhileStatement': {
        const whileStmt = node as WhileStatementNode;
        visit(whileStmt.condition, currentScope);
        visit(whileStmt.body, currentScope);
        break;
      }

      default: {
        // For all other nodes, recurse into children
        for (const child of node.children) {
          visit(child, currentScope);
        }
        break;
      }
    }
  }

  // Create the global/program scope
  const globalScope = createScope(ast.range, null);

  for (const stmt of ast.body) {
    visit(stmt, globalScope);
  }

  return scopes;
}

/**
 * Find the innermost scope that contains the given position.
 */
export function findScopeAtPosition(scopes: Scope[], line: number, character: number): Scope | null {
  let best: Scope | null = null;

  for (const scope of scopes) {
    if (containsPosition(scope.range, line, character)) {
      // Pick the most deeply nested (smallest) scope that contains the position.
      // Since child scopes are always added after their parents, a later match
      // with a parent chain that includes `best` is more specific.
      if (best === null || isChildOf(scope, best)) {
        best = scope;
      }
    }
  }

  return best;
}

/**
 * Create an empty SymbolTable.
 */
export function createSymbolTable(): SymbolTable {
  return { symbols: new Map(), scopes: [] };
}

// ---- Semantic Analysis ----

/** Catspeak keywords for completion suggestions. */
const CATSPEAK_KEYWORDS = [
  'let', 'fun', 'if', 'else', 'while', 'for', 'return', 'break', 'continue',
  'throw', 'catch', 'do', 'match', 'with', 'new', 'self', 'other',
  'true', 'false', 'undefined', 'infinity', 'NaN',
  'and', 'or', 'xor', 'impl', 'params', 'loop',
];

/**
 * Analyze a parsed AST: build scopes, collect symbols, and gather references.
 * Returns an AnalysisResult with the symbol table, diagnostics, and semantic tokens.
 *
 * @param ast - The parsed program AST
 * @param parseErrors - Optional array of parse errors to convert into Error diagnostics
 * @param tokens - Optional token array for extracting doc comments above declarations
 */
export function analyze(ast: ProgramNode, parseErrors?: ParseError[], tokens?: import('./lexer').Token[]): AnalysisResult {
  const scopes = buildScopeHierarchy(ast);
  const allSymbols = new Map<string, CatspeakSymbol>();
  const references: SymbolReference[] = [];
  const semanticTokens: SemanticToken[] = [];

  // Build a map of line -> comment text from tokens for doc comment extraction
  const commentsByLine = new Map<number, string>();
  if (tokens) {
    for (const tok of tokens) {
      if (tok.type === 'Comment') {
        // Strip the leading -- and trim
        const text = tok.value.replace(/^--\s?/, '');
        const existing = commentsByLine.get(tok.range.start.line);
        commentsByLine.set(tok.range.start.line, existing ? existing + '\n' + text : text);
      }
    }
  }

  // Collect symbols by traversing the AST and populating scopes
  collectSymbols(ast, scopes, allSymbols, references, semanticTokens);

  // Attach doc comments to symbols: consecutive -- comments immediately above a declaration
  if (tokens) {
    for (const [, sym] of allSymbols) {
      const declLine = sym.declarationRange.start.line;
      const docLines: string[] = [];
      let line = declLine - 1;
      while (line >= 0 && commentsByLine.has(line)) {
        docLines.unshift(commentsByLine.get(line)!);
        line--;
      }
      if (docLines.length > 0) {
        sym.documentation = docLines.join('\n');
      }
    }
  }

  const symbolTable: SymbolTable = { symbols: allSymbols, scopes };

  // Generate diagnostics
  const diagnostics: Diagnostic[] = [];

  // 1. Convert parse errors to Error diagnostics
  if (parseErrors) {
    for (const err of parseErrors) {
      diagnostics.push({
        range: err.range,
        severity: DiagnosticSeverity.Error,
        message: err.message,
        source: 'catspeak',
      });
    }
  }

  // 2. Detect undefined variable references (Warning)
  // 3. Detect unused variable declarations (Hint)
  generateSemanticDiagnostics(scopes, references, diagnostics);

  return {
    symbols: symbolTable,
    diagnostics,
    semanticTokens,
  };
}

/**
 * Generate semantic diagnostics: undefined variable warnings and unused variable hints.
 */
function generateSemanticDiagnostics(
  scopes: Scope[],
  references: SymbolReference[],
  diagnostics: Diagnostic[],
): void {
  // Track which symbols are referenced (by identity) for unused detection
  const referencedSymbols = new Set<CatspeakSymbol>();

  // Check each non-declaration reference to see if it resolves
  for (const ref of references) {
    if (ref.isDeclaration) continue;
    if (ref.isProperty) continue; // Properties accessed via . should never trigger undefined warnings

    const scope = findScopeAtPosition(scopes, ref.range.start.line, ref.range.start.character);
    if (!scope) continue;

    const resolved = resolveSymbolInScope(scope, ref.name);
    if (resolved) {
      referencedSymbols.add(resolved);
    } else if (!GML_BUILTINS.has(ref.name) && !GML_ALL_NAMES.has(ref.name) && !CATSPEAK_KEYWORDS.includes(ref.name)) {
      // Undefined variable reference (skip GML builtins and keywords)
      diagnostics.push({
        range: ref.range,
        severity: DiagnosticSeverity.Warning,
        message: `Undefined variable '${ref.name}'`,
        source: 'catspeak',
      });
    }
  }

  // Check for unused declarations
  for (const scope of scopes) {
    for (const [, sym] of scope.symbols) {
      if (!referencedSymbols.has(sym)) {
        diagnostics.push({
          range: sym.range,
          severity: DiagnosticSeverity.Hint,
          message: `'${sym.name}' is declared but never used`,
          source: 'catspeak',
        });
      }
    }
  }
}

/**
 * Traverse the AST and collect symbol declarations into the appropriate scopes.
 * Also records identifier references and generates semantic tokens.
 */
function collectSymbols(
  ast: ProgramNode,
  scopes: Scope[],
  allSymbols: Map<string, CatspeakSymbol>,
  references: SymbolReference[],
  semanticTokens: SemanticToken[],
): void {
  function addSymbol(scope: Scope, symbol: CatspeakSymbol): void {
    scope.symbols.set(symbol.name, symbol);
    // Use a unique key for the global map to avoid collisions across scopes
    const key = `${symbol.name}@${symbol.range.start.line}:${symbol.range.start.character}`;
    allSymbols.set(key, symbol);
  }

  function findEnclosingScope(line: number, character: number): Scope | null {
    return findScopeAtPosition(scopes, line, character);
  }

  function visit(node: ASTNode): void {
    switch (node.type) {
      case 'LetDeclaration': {
        const letNode = node as LetDeclarationNode;
        const nameNode = letNode.name;
        if (nameNode.name === '<error>') break;

        const scope = findEnclosingScope(nameNode.range.start.line, nameNode.range.start.character);
        if (scope) {
          // Determine if the value is a function expression
          const isFun = letNode.value?.type === 'FunctionExpression';
          const symbol: CatspeakSymbol = {
            name: nameNode.name,
            kind: isFun ? 'Function' : 'Variable',
            range: nameNode.range,
            declarationRange: letNode.range,
            type: isFun ? 'fun' : undefined,
          };
          addSymbol(scope, symbol);

          semanticTokens.push({
            line: nameNode.range.start.line,
            character: nameNode.range.start.character,
            length: nameNode.name.length,
            tokenType: isFun ? 'function' : 'variable',
            tokenModifiers: ['declaration'],
          });

          references.push({
            name: nameNode.name,
            range: nameNode.range,
            isDeclaration: true,
          });
        }

        // Visit the value expression
        if (letNode.value) {
          visit(letNode.value);
        }
        break;
      }

      case 'FunctionExpression': {
        const fnNode = node as FunctionExpressionNode;
        // Collect parameters as symbols in the function's scope
        for (const param of fnNode.params) {
          if (param.name === '<error>') continue;
          const paramScope = findEnclosingScope(param.range.start.line, param.range.start.character);
          if (paramScope) {
            const symbol: CatspeakSymbol = {
              name: param.name,
              kind: 'Parameter',
              range: param.range,
              declarationRange: param.range,
            };
            addSymbol(paramScope, symbol);

            semanticTokens.push({
              line: param.range.start.line,
              character: param.range.start.character,
              length: param.name.length,
              tokenType: 'parameter',
              tokenModifiers: ['declaration'],
            });

            references.push({
              name: param.name,
              range: param.range,
              isDeclaration: true,
            });
          }
        }
        // Visit the body
        visit(fnNode.body);
        break;
      }

      case 'ForStatement': {
        const forNode = node as ForStatementNode;
        // The loop variable is declared in the for scope
        const varNode = forNode.variable;
        if (varNode.name !== '<error>') {
          const scope = findEnclosingScope(varNode.range.start.line, varNode.range.start.character);
          if (scope) {
            const symbol: CatspeakSymbol = {
              name: varNode.name,
              kind: 'Variable',
              range: varNode.range,
              declarationRange: forNode.range,
            };
            addSymbol(scope, symbol);

            semanticTokens.push({
              line: varNode.range.start.line,
              character: varNode.range.start.character,
              length: varNode.name.length,
              tokenType: 'variable',
              tokenModifiers: ['declaration'],
            });

            references.push({
              name: varNode.name,
              range: varNode.range,
              isDeclaration: true,
            });
          }
        }
        visit(forNode.iterable);
        visit(forNode.body);
        break;
      }

      case 'MemberExpression': {
        const memberNode = node as MemberExpressionNode;
        // Visit the object side
        visit(memberNode.object);
        // Record the property as a Property symbol reference
        const propNode = memberNode.property;
        if (propNode.name !== '<error>') {
          semanticTokens.push({
            line: propNode.range.start.line,
            character: propNode.range.start.character,
            length: propNode.name.length,
            tokenType: 'property',
          });

          references.push({
            name: propNode.name,
            range: propNode.range,
            isDeclaration: false,
            isProperty: true,
          });
        }
        break;
      }

      case 'Identifier': {
        const idNode = node as IdentifierNode;
        if (idNode.name === '<error>') break;

        // Classify the identifier based on what it resolves to
        const scope = findEnclosingScope(idNode.range.start.line, idNode.range.start.character);
        if (scope) {
          const resolved = resolveSymbolInScope(scope, idNode.name);
          const tokenType = resolved
            ? (resolved.kind === 'Function' ? 'function'
              : resolved.kind === 'Parameter' ? 'parameter'
              : 'variable')
            : 'variable';

          semanticTokens.push({
            line: idNode.range.start.line,
            character: idNode.range.start.character,
            length: idNode.name.length,
            tokenType,
          });
        }

        references.push({
          name: idNode.name,
          range: idNode.range,
          isDeclaration: false,
        });
        break;
      }

      case 'IfStatement': {
        const ifNode = node as IfStatementNode;
        visit(ifNode.condition);
        visit(ifNode.consequent);
        if (ifNode.alternate) visit(ifNode.alternate);
        break;
      }

      case 'WhileStatement': {
        const whileNode = node as WhileStatementNode;
        visit(whileNode.condition);
        visit(whileNode.body);
        break;
      }

      case 'BlockExpression': {
        const blockNode = node as BlockExpressionNode;
        for (const stmt of blockNode.body) {
          visit(stmt);
        }
        break;
      }

      case 'AssignmentExpression': {
        const assignNode = node as AssignmentExpressionNode;
        // If left side is a bare identifier with '=', treat as a declaration
        if (assignNode.operator === '=' && assignNode.left.type === 'Identifier') {
          const nameNode = assignNode.left as IdentifierNode;
          if (nameNode.name !== '<error>') {
            const scope = findEnclosingScope(nameNode.range.start.line, nameNode.range.start.character);
            if (scope) {
              // Only register if not already declared in this scope
              if (!resolveSymbolInScope(scope, nameNode.name)) {
                const isFun = assignNode.right?.type === 'FunctionExpression';
                const symbol: CatspeakSymbol = {
                  name: nameNode.name,
                  kind: isFun ? 'Function' : 'Variable',
                  range: nameNode.range,
                  declarationRange: assignNode.range,
                  type: isFun ? 'fun' : undefined,
                };
                addSymbol(scope, symbol);

                semanticTokens.push({
                  line: nameNode.range.start.line,
                  character: nameNode.range.start.character,
                  length: nameNode.name.length,
                  tokenType: isFun ? 'function' : 'variable',
                  tokenModifiers: ['declaration'],
                });

                references.push({
                  name: nameNode.name,
                  range: nameNode.range,
                  isDeclaration: true,
                });
              }
            }
          }
        } else {
          // Visit left side normally for compound assignments or member access
          visit(assignNode.left);
        }
        // Always visit the right side
        visit(assignNode.right);
        break;
      }

      case 'ExpressionStatement': {
        const exprStmt = node as ExpressionStatementNode;
        visit(exprStmt.expression);
        break;
      }

      case 'AssignmentExpression': {
        const assignNode = node as AssignmentExpressionNode;
        // Treat bare `identifier = expr` as a variable declaration
        if (assignNode.operator === '=' && assignNode.left.type === 'Identifier') {
          const nameNode = assignNode.left as IdentifierNode;
          if (nameNode.name !== '<error>') {
            const scope = findEnclosingScope(nameNode.range.start.line, nameNode.range.start.character);
            if (scope) {
              const isFun = assignNode.right?.type === 'FunctionExpression';
              const symbol: CatspeakSymbol = {
                name: nameNode.name,
                kind: isFun ? 'Function' : 'Variable',
                range: nameNode.range,
                declarationRange: assignNode.range,
                type: isFun ? 'fun' : undefined,
              };
              addSymbol(scope, symbol);

              semanticTokens.push({
                line: nameNode.range.start.line,
                character: nameNode.range.start.character,
                length: nameNode.name.length,
                tokenType: isFun ? 'function' : 'variable',
                tokenModifiers: ['declaration'],
              });

              references.push({
                name: nameNode.name,
                range: nameNode.range,
                isDeclaration: true,
              });
            }
          }
          // Visit the right-hand side
          visit(assignNode.right);
        } else {
          // For non-simple assignments, just recurse into children
          for (const child of assignNode.children) {
            visit(child);
          }
        }
        break;
      }

      default: {
        // Recurse into children for all other node types
        for (const child of node.children) {
          visit(child);
        }
        break;
      }
    }
  }

  for (const stmt of ast.body) {
    visit(stmt);
  }
}

/**
 * Resolve a symbol name by searching from the given scope outward through parent scopes.
 */
export function resolveSymbolInScope(scope: Scope, name: string): CatspeakSymbol | null {
  let current: Scope | null = scope;
  while (current !== null) {
    const sym = current.symbols.get(name);
    if (sym) return sym;
    current = current.parent;
  }
  return null;
}

/**
 * Get the symbol at a given position in the source.
 * Finds the innermost scope at the position, then checks if any symbol's range
 * contains that position. If found, resolves it through the scope chain.
 */
export function getSymbolAtPosition(
  analysisResult: AnalysisResult,
  line: number,
  character: number,
): CatspeakSymbol | null {
  const { symbols } = analysisResult;
  const scope = findScopeAtPosition(symbols.scopes, line, character);
  if (!scope) return null;

  // Check all symbols in all scopes for one whose range contains the position
  for (const s of symbols.scopes) {
    for (const [, sym] of s.symbols) {
      if (containsPosition(sym.range, line, character)) {
        return sym;
      }
    }
  }

  // Also try to resolve by finding an identifier name at the position
  // by checking semantic tokens
  for (const token of analysisResult.semanticTokens) {
    if (token.line === line && character >= token.character && character < token.character + token.length) {
      // We found a token at this position — try to resolve the symbol name
      // We need to find the name from the token. Since semantic tokens don't store names,
      // we search the scope chain for symbols that match.
      // Look for a symbol whose range matches this token's position
      const tokenRange: Range = {
        start: { line: token.line, character: token.character },
        end: { line: token.line, character: token.character + token.length },
      };

      // First check if any symbol declaration is at this exact position
      for (const s of symbols.scopes) {
        for (const [, sym] of s.symbols) {
          if (sym.range.start.line === tokenRange.start.line &&
              sym.range.start.character === tokenRange.start.character) {
            return sym;
          }
        }
      }

      // If not a declaration, try to resolve by searching scope chain
      // We need the name — find it from the symbols map
      for (const s of symbols.scopes) {
        for (const [name, sym] of s.symbols) {
          // Check if this symbol name could be at this position by resolving from scope
          const resolved = resolveSymbolInScope(scope, name);
          if (resolved) return resolved;
        }
      }
    }
  }

  return null;
}

/**
 * Get the symbol at a position given the AST and analysis result.
 * This version also accepts the AST to find the identifier name at the position.
 */
export function getSymbolAtPositionWithAST(
  ast: ProgramNode,
  analysisResult: AnalysisResult,
  line: number,
  character: number,
): CatspeakSymbol | null {
  // First find the identifier node at this position
  const idNode = findIdentifierAtPosition(ast, line, character);
  if (!idNode) return null;

  const { symbols } = analysisResult;
  const scope = findScopeAtPosition(symbols.scopes, line, character);
  if (!scope) return null;

  return resolveSymbolInScope(scope, idNode.name);
}

/**
 * Find an identifier AST node at the given position.
 */
function findIdentifierAtPosition(node: ASTNode, line: number, character: number): IdentifierNode | null {
  if (node.type === 'Identifier') {
    const id = node as IdentifierNode;
    if (containsPosition(id.range, line, character)) {
      return id;
    }
    return null;
  }

  // Special handling for MemberExpression — check property
  if (node.type === 'MemberExpression') {
    const member = node as MemberExpressionNode;
    const propResult = findIdentifierAtPosition(member.property, line, character);
    if (propResult) return propResult;
    const objResult = findIdentifierAtPosition(member.object, line, character);
    if (objResult) return objResult;
    return null;
  }

  for (const child of node.children) {
    const result = findIdentifierAtPosition(child, line, character);
    if (result) return result;
  }
  return null;
}

/**
 * Find all references to the symbol at the given position.
 * Searches the entire AST for identifiers with the same name that resolve
 * to the same declaration.
 */
export function getReferences(
  ast: ProgramNode,
  analysisResult: AnalysisResult,
  line: number,
  character: number,
): Range[] {
  const idNode = findIdentifierAtPosition(ast, line, character);
  if (!idNode) return [];

  const { symbols } = analysisResult;
  const scope = findScopeAtPosition(symbols.scopes, line, character);
  if (!scope) return [];

  const targetSymbol = resolveSymbolInScope(scope, idNode.name);
  if (!targetSymbol) return [];

  // Collect all identifier nodes in the AST with the same name
  // that resolve to the same declaration
  const refs: Range[] = [];
  collectReferences(ast, symbols.scopes, targetSymbol, refs);
  return refs;
}

/**
 * Recursively collect all references to a target symbol in the AST.
 */
function collectReferences(
  node: ASTNode,
  scopes: Scope[],
  targetSymbol: CatspeakSymbol,
  refs: Range[],
): void {
  if (node.type === 'Identifier') {
    const id = node as IdentifierNode;
    if (id.name === targetSymbol.name) {
      const scope = findScopeAtPosition(scopes, id.range.start.line, id.range.start.character);
      if (scope) {
        const resolved = resolveSymbolInScope(scope, id.name);
        if (resolved === targetSymbol) {
          refs.push(id.range);
        }
      }
    }
    return;
  }

  // For LetDeclaration, also check the name identifier
  if (node.type === 'LetDeclaration') {
    const letNode = node as LetDeclarationNode;
    if (letNode.name.name === targetSymbol.name) {
      const scope = findScopeAtPosition(scopes, letNode.name.range.start.line, letNode.name.range.start.character);
      if (scope) {
        const resolved = scope.symbols.get(letNode.name.name);
        if (resolved === targetSymbol) {
          refs.push(letNode.name.range);
        }
      }
    }
    if (letNode.value) {
      collectReferences(letNode.value, scopes, targetSymbol, refs);
    }
    return;
  }

  // For FunctionExpression, check params
  if (node.type === 'FunctionExpression') {
    const fnNode = node as FunctionExpressionNode;
    for (const param of fnNode.params) {
      if (param.name === targetSymbol.name) {
        const scope = findScopeAtPosition(scopes, param.range.start.line, param.range.start.character);
        if (scope) {
          const resolved = scope.symbols.get(param.name);
          if (resolved === targetSymbol) {
            refs.push(param.range);
          }
        }
      }
    }
    collectReferences(fnNode.body, scopes, targetSymbol, refs);
    return;
  }

  // For ForStatement, check the variable
  if (node.type === 'ForStatement') {
    const forNode = node as ForStatementNode;
    if (forNode.variable.name === targetSymbol.name) {
      const scope = findScopeAtPosition(scopes, forNode.variable.range.start.line, forNode.variable.range.start.character);
      if (scope) {
        const resolved = scope.symbols.get(forNode.variable.name);
        if (resolved === targetSymbol) {
          refs.push(forNode.variable.range);
        }
      }
    }
    collectReferences(forNode.iterable, scopes, targetSymbol, refs);
    collectReferences(forNode.body, scopes, targetSymbol, refs);
    return;
  }

  for (const child of node.children) {
    collectReferences(child, scopes, targetSymbol, refs);
  }
}

/**
 * Get completion items for a given position.
 * Returns symbols visible from the scope at the position, plus keywords.
 */
export function getCompletions(
  analysisResult: AnalysisResult,
  line: number,
  character: number,
): CompletionItem[] {
  const { symbols } = analysisResult;
  const scope = findScopeAtPosition(symbols.scopes, line, character);
  const items: CompletionItem[] = [];
  const seen = new Set<string>();

  // Collect symbols from the scope chain (local first, then outward)
  if (scope) {
    let current: Scope | null = scope;
    let priority = 0;
    while (current !== null) {
      for (const [name, sym] of current.symbols) {
        if (!seen.has(name)) {
          seen.add(name);
          items.push({
            label: name,
            kind: symbolKindToCompletionKind(sym.kind),
            detail: sym.type ?? sym.kind.toLowerCase(),
            documentation: sym.documentation,
            sortText: String(priority).padStart(2, '0') + name,
          });
        }
      }
      current = current.parent;
      priority++;
    }
  }

  // Add keywords
  for (const kw of CATSPEAK_KEYWORDS) {
    if (!seen.has(kw)) {
      seen.add(kw);
      items.push({
        label: kw,
        kind: CompletionItemKind.Keyword,
        detail: 'keyword',
        sortText: '99' + kw,
      });
    }
  }

  return items;
}

function symbolKindToCompletionKind(kind: SymbolKind): CompletionItemKind {
  switch (kind) {
    case 'Function': return CompletionItemKind.Function;
    case 'Variable': return CompletionItemKind.Variable;
    case 'Parameter': return CompletionItemKind.Variable;
    case 'Property': return CompletionItemKind.Property;
    case 'Keyword': return CompletionItemKind.Keyword;
  }
}

// ---- Helpers ----

function containsPosition(range: Range, line: number, character: number): boolean {
  if (line < range.start.line || line > range.end.line) return false;
  if (line === range.start.line && character < range.start.character) return false;
  if (line === range.end.line && character > range.end.character) return false;
  return true;
}

function isChildOf(child: Scope, ancestor: Scope): boolean {
  let current = child.parent;
  while (current !== null) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}
