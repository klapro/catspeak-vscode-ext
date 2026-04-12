import { parse } from './parser';
import {
  CatspeakSymbol,
  SymbolKind,
  Scope,
  SymbolTable,
  buildScopeHierarchy,
  findScopeAtPosition,
  createSymbolTable,
  analyze,
  AnalysisResult,
  Diagnostic,
  DiagnosticSeverity,
  resolveSymbolInScope,
  getSymbolAtPositionWithAST,
  getReferences,
  getCompletions,
  CompletionItemKind,
} from './analyzer';

describe('Symbol and Scope types', () => {
  test('CatspeakSymbol has required fields', () => {
    const sym: CatspeakSymbol = {
      name: 'x',
      kind: 'Variable',
      range: { start: { line: 0, character: 4 }, end: { line: 0, character: 5 } },
      declarationRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
    };
    expect(sym.name).toBe('x');
    expect(sym.kind).toBe('Variable');
    expect(sym.type).toBeUndefined();
    expect(sym.documentation).toBeUndefined();
  });

  test('CatspeakSymbol supports optional type and documentation', () => {
    const sym: CatspeakSymbol = {
      name: 'greet',
      kind: 'Function',
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
      declarationRange: { start: { line: 0, character: 0 }, end: { line: 2, character: 1 } },
      type: 'fun',
      documentation: 'Greets the user',
    };
    expect(sym.type).toBe('fun');
    expect(sym.documentation).toBe('Greets the user');
  });

  test('SymbolKind covers all expected kinds', () => {
    const kinds: SymbolKind[] = ['Variable', 'Function', 'Parameter', 'Property', 'Keyword'];
    expect(kinds).toHaveLength(5);
  });

  test('createSymbolTable returns empty table', () => {
    const table: SymbolTable = createSymbolTable();
    expect(table.symbols.size).toBe(0);
    expect(table.scopes).toHaveLength(0);
  });
});

describe('buildScopeHierarchy', () => {
  test('creates a global scope for an empty program', () => {
    const result = parse('');
    const scopes = buildScopeHierarchy(result.ast);
    expect(scopes.length).toBe(1);
    expect(scopes[0].parent).toBeNull();
    expect(scopes[0].symbols.size).toBe(0);
  });

  test('creates a global scope for a simple let declaration', () => {
    const result = parse('let x = 1');
    const scopes = buildScopeHierarchy(result.ast);
    // Only the global scope — let doesn't introduce a new scope
    expect(scopes.length).toBe(1);
    expect(scopes[0].parent).toBeNull();
  });

  test('creates a child scope for a function expression', () => {
    const result = parse('let f = fun(a, b) { a }');
    const scopes = buildScopeHierarchy(result.ast);
    // global + function + block inside function
    expect(scopes.length).toBeGreaterThanOrEqual(2);
    // The function scope should have the global scope as parent
    const fnScope = scopes.find(s => s.parent === scopes[0] && s !== scopes[0]);
    expect(fnScope).toBeDefined();
  });

  test('creates nested scopes for nested functions', () => {
    const source = `let outer = fun() {
  let inner = fun() {
    1
  }
}`;
    const result = parse(source);
    const scopes = buildScopeHierarchy(result.ast);
    // global + outer fun + outer block + inner fun + inner block
    expect(scopes.length).toBeGreaterThanOrEqual(3);
  });

  test('creates a scope for block expressions', () => {
    const source = `{
  let x = 1
}`;
    const result = parse(source);
    const scopes = buildScopeHierarchy(result.ast);
    // global + block
    expect(scopes.length).toBeGreaterThanOrEqual(2);
  });

  test('creates a scope for for-statement', () => {
    const source = 'for i in items { i }';
    const result = parse(source);
    const scopes = buildScopeHierarchy(result.ast);
    // global + for scope + block inside for
    expect(scopes.length).toBeGreaterThanOrEqual(2);
  });

  test('scope parent chain is correct', () => {
    const source = `let f = fun(x) {
  let g = fun(y) {
    y
  }
}`;
    const result = parse(source);
    const scopes = buildScopeHierarchy(result.ast);
    const globalScope = scopes[0];
    expect(globalScope.parent).toBeNull();

    // Every non-global scope should eventually chain back to global
    for (const scope of scopes) {
      if (scope === globalScope) continue;
      let current: Scope | null = scope;
      while (current !== null && current !== globalScope) {
        current = current.parent;
      }
      expect(current).toBe(globalScope);
    }
  });
});

describe('findScopeAtPosition', () => {
  test('returns null for empty scopes array', () => {
    expect(findScopeAtPosition([], 0, 0)).toBeNull();
  });

  test('returns global scope for position in simple program', () => {
    const result = parse('let x = 1');
    const scopes = buildScopeHierarchy(result.ast);
    const scope = findScopeAtPosition(scopes, 0, 5);
    expect(scope).toBeDefined();
    expect(scope!.parent).toBeNull();
  });

  test('returns innermost scope for position inside a function body', () => {
    const source = `let f = fun(a) {
  a
}`;
    const result = parse(source);
    const scopes = buildScopeHierarchy(result.ast);
    // Position inside the function body (line 1, character 2)
    const scope = findScopeAtPosition(scopes, 1, 2);
    expect(scope).toBeDefined();
    // The innermost scope should have a non-null parent (it's not the global scope)
    expect(scope!.parent).not.toBeNull();
  });
});


// ---- Tests for analyze() ----

describe('analyze', () => {
  test('collects symbols from let declarations', () => {
    const { ast } = parse('let x = 1');
    const result = analyze(ast);
    const syms = Array.from(result.symbols.symbols.values());
    expect(syms.length).toBe(1);
    expect(syms[0].name).toBe('x');
    expect(syms[0].kind).toBe('Variable');
  });

  test('collects function symbols from let + fun', () => {
    const { ast } = parse('let greet = fun(name) { name }');
    const result = analyze(ast);
    const syms = Array.from(result.symbols.symbols.values());
    const greet = syms.find(s => s.name === 'greet');
    expect(greet).toBeDefined();
    expect(greet!.kind).toBe('Function');
    expect(greet!.type).toBe('fun');
  });

  test('collects parameter symbols from fun expressions', () => {
    const { ast } = parse('let f = fun(a, b) { a }');
    const result = analyze(ast);
    const syms = Array.from(result.symbols.symbols.values());
    const paramA = syms.find(s => s.name === 'a');
    const paramB = syms.find(s => s.name === 'b');
    expect(paramA).toBeDefined();
    expect(paramA!.kind).toBe('Parameter');
    expect(paramB).toBeDefined();
    expect(paramB!.kind).toBe('Parameter');
  });

  test('collects for-loop variable as a symbol', () => {
    const { ast } = parse('for i in items { i }');
    const result = analyze(ast);
    const syms = Array.from(result.symbols.symbols.values());
    const iSym = syms.find(s => s.name === 'i');
    expect(iSym).toBeDefined();
    expect(iSym!.kind).toBe('Variable');
  });

  test('generates semantic tokens for declarations', () => {
    const { ast } = parse('let x = 1');
    const result = analyze(ast);
    const declTokens = result.semanticTokens.filter(
      t => t.tokenModifiers && t.tokenModifiers.includes('declaration')
    );
    expect(declTokens.length).toBeGreaterThanOrEqual(1);
    expect(declTokens[0].tokenType).toBe('variable');
  });

  test('generates semantic tokens for member access as property', () => {
    const { ast } = parse('obj.field');
    const result = analyze(ast);
    const propTokens = result.semanticTokens.filter(t => t.tokenType === 'property');
    expect(propTokens.length).toBeGreaterThanOrEqual(1);
  });

  test('returns diagnostics from analyze', () => {
    const { ast } = parse('let x = 1');
    const result = analyze(ast);
    // x is declared but never used, so we get a hint
    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0].severity).toBe(DiagnosticSeverity.Hint);
    expect(result.diagnostics[0].source).toBe('catspeak');
  });

  test('handles multiple let declarations', () => {
    const source = `let a = 1
let b = 2
let c = 3`;
    const { ast } = parse(source);
    const result = analyze(ast);
    const syms = Array.from(result.symbols.symbols.values());
    const names = syms.map(s => s.name).sort();
    expect(names).toEqual(['a', 'b', 'c']);
  });

  test('handles nested functions with parameters', () => {
    const source = `let outer = fun(x) {
  let inner = fun(y) {
    y
  }
}`;
    const { ast } = parse(source);
    const result = analyze(ast);
    const syms = Array.from(result.symbols.symbols.values());
    const names = syms.map(s => s.name).sort();
    expect(names).toContain('outer');
    expect(names).toContain('inner');
    expect(names).toContain('x');
    expect(names).toContain('y');
  });
});

// ---- Tests for resolveSymbolInScope ----

describe('resolveSymbolInScope', () => {
  test('resolves symbol in current scope', () => {
    const { ast } = parse('let x = 1');
    const result = analyze(ast);
    const globalScope = result.symbols.scopes[0];
    const resolved = resolveSymbolInScope(globalScope, 'x');
    expect(resolved).not.toBeNull();
    expect(resolved!.name).toBe('x');
  });

  test('resolves symbol from parent scope', () => {
    const source = `let x = 1
let f = fun() {
  x
}`;
    const { ast } = parse(source);
    const result = analyze(ast);
    // Find the innermost scope (function body)
    const innerScope = result.symbols.scopes.find(s => s.parent !== null && s.parent.parent !== null);
    if (innerScope) {
      const resolved = resolveSymbolInScope(innerScope, 'x');
      expect(resolved).not.toBeNull();
      expect(resolved!.name).toBe('x');
    }
  });

  test('returns null for undefined symbol', () => {
    const { ast } = parse('let x = 1');
    const result = analyze(ast);
    const globalScope = result.symbols.scopes[0];
    const resolved = resolveSymbolInScope(globalScope, 'nonexistent');
    expect(resolved).toBeNull();
  });
});

// ---- Tests for getSymbolAtPositionWithAST ----

describe('getSymbolAtPositionWithAST', () => {
  test('finds symbol at declaration position', () => {
    const { ast } = parse('let x = 1');
    const result = analyze(ast);
    // 'x' starts at character 4 on line 0
    const sym = getSymbolAtPositionWithAST(ast, result, 0, 4);
    expect(sym).not.toBeNull();
    expect(sym!.name).toBe('x');
  });

  test('finds symbol at reference position', () => {
    const source = `let x = 1
x`;
    const { ast } = parse(source);
    const result = analyze(ast);
    // 'x' reference on line 1, character 0
    const sym = getSymbolAtPositionWithAST(ast, result, 1, 0);
    expect(sym).not.toBeNull();
    expect(sym!.name).toBe('x');
  });

  test('returns null for position with no identifier', () => {
    const { ast } = parse('let x = 1');
    const result = analyze(ast);
    // Position at '=' sign area
    const sym = getSymbolAtPositionWithAST(ast, result, 0, 6);
    expect(sym).toBeNull();
  });
});

// ---- Tests for getReferences ----

describe('getReferences', () => {
  test('finds all references to a variable', () => {
    const source = `let x = 1
x
x`;
    const { ast } = parse(source);
    const result = analyze(ast);
    // Get references from the declaration position
    const refs = getReferences(ast, result, 0, 4);
    // Should include declaration + 2 usages
    expect(refs.length).toBe(3);
  });

  test('finds references to a parameter', () => {
    const source = `let f = fun(a) {
  a
}`;
    const { ast } = parse(source);
    const result = analyze(ast);
    // 'a' parameter at line 0, character 12
    const refs = getReferences(ast, result, 0, 12);
    // declaration + usage
    expect(refs.length).toBe(2);
  });

  test('returns empty for position with no identifier', () => {
    const { ast } = parse('let x = 1');
    const result = analyze(ast);
    const refs = getReferences(ast, result, 0, 6);
    expect(refs).toEqual([]);
  });

  test('does not mix references from different scopes', () => {
    const source = `let x = 1
let f = fun() {
  let x = 2
  x
}
x`;
    const { ast } = parse(source);
    const result = analyze(ast);
    // Reference to outer x (line 5, char 0)
    const outerRefs = getReferences(ast, result, 5, 0);
    // Should find the outer x declaration and the outer x reference
    expect(outerRefs.length).toBe(2);
  });
});

// ---- Tests for getCompletions ----

describe('getCompletions', () => {
  test('includes declared variables in completions', () => {
    const source = `let x = 1
let y = 2`;
    const { ast } = parse(source);
    const result = analyze(ast);
    // Position inside the source (line 1, char 8 is within 'let y = 2')
    const completions = getCompletions(result, 1, 8);
    const labels = completions.map(c => c.label);
    expect(labels).toContain('x');
    expect(labels).toContain('y');
  });

  test('includes keywords in completions', () => {
    const { ast } = parse('');
    const result = analyze(ast);
    const completions = getCompletions(result, 0, 0);
    const labels = completions.map(c => c.label);
    expect(labels).toContain('let');
    expect(labels).toContain('fun');
    expect(labels).toContain('if');
  });

  test('includes function parameters in scope', () => {
    const source = `let f = fun(a, b) {
  a
}`;
    const { ast } = parse(source);
    const result = analyze(ast);
    // Inside the function body
    const completions = getCompletions(result, 1, 2);
    const labels = completions.map(c => c.label);
    expect(labels).toContain('a');
    expect(labels).toContain('b');
  });

  test('function completions have Function kind', () => {
    const { ast } = parse('let greet = fun() { 1 }');
    const result = analyze(ast);
    // Position inside the source range
    const completions = getCompletions(result, 0, 22);
    const greetItem = completions.find(c => c.label === 'greet');
    expect(greetItem).toBeDefined();
    expect(greetItem!.kind).toBe(CompletionItemKind.Function);
  });

  test('keyword completions have Keyword kind', () => {
    const { ast } = parse('');
    const result = analyze(ast);
    const completions = getCompletions(result, 0, 0);
    const letItem = completions.find(c => c.label === 'let');
    expect(letItem).toBeDefined();
    expect(letItem!.kind).toBe(CompletionItemKind.Keyword);
  });

  test('local symbols are prioritized over keywords in sortText', () => {
    const { ast } = parse('let x = 1');
    const result = analyze(ast);
    // Position inside the source range
    const completions = getCompletions(result, 0, 8);
    const xItem = completions.find(c => c.label === 'x');
    const letItem = completions.find(c => c.label === 'let');
    expect(xItem).toBeDefined();
    expect(letItem).toBeDefined();
    // Local symbols should sort before keywords
    expect(xItem!.sortText! < letItem!.sortText!).toBe(true);
  });
});


// ---- Tests for diagnostic generation ----

describe('diagnostic generation', () => {
  describe('syntax error diagnostics from parse errors', () => {
    test('converts parse errors to Error diagnostics', () => {
      const parseResult = parse('let = 1');
      const result = analyze(parseResult.ast, parseResult.errors);
      const errorDiags = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Error
      );
      expect(errorDiags.length).toBeGreaterThanOrEqual(1);
      expect(errorDiags[0].source).toBe('catspeak');
    });

    test('parse error diagnostics have correct range', () => {
      const parseResult = parse('let = 1');
      const result = analyze(parseResult.ast, parseResult.errors);
      const errorDiags = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Error
      );
      expect(errorDiags.length).toBeGreaterThanOrEqual(1);
      // Range should have valid start/end positions
      const diag = errorDiags[0];
      expect(diag.range.start).toBeDefined();
      expect(diag.range.end).toBeDefined();
      expect(diag.range.start.line).toBeGreaterThanOrEqual(0);
    });

    test('no error diagnostics for valid code', () => {
      const parseResult = parse('let x = 1');
      const result = analyze(parseResult.ast, parseResult.errors);
      const errorDiags = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Error
      );
      expect(errorDiags).toHaveLength(0);
    });

    test('no error diagnostics when parseErrors not provided', () => {
      const { ast } = parse('let = 1');
      // Call without parseErrors
      const result = analyze(ast);
      const errorDiags = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Error
      );
      expect(errorDiags).toHaveLength(0);
    });
  });

  describe('undefined variable reference warnings', () => {
    test('warns on undefined variable reference', () => {
      const { ast } = parse('zzz_not_defined');
      const result = analyze(ast);
      const warnings = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Warning
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0].message).toContain('zzz_not_defined');
      expect(warnings[0].source).toBe('catspeak');
    });

    test('no warning for defined variable', () => {
      const source = `let x = 1
x`;
      const { ast } = parse(source);
      const result = analyze(ast);
      const warnings = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Warning
      );
      expect(warnings).toHaveLength(0);
    });

    test('no warning for parameter reference inside function', () => {
      const source = `let f = fun(a) {
  a
}`;
      const { ast } = parse(source);
      const result = analyze(ast);
      const warnings = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Warning
      );
      expect(warnings).toHaveLength(0);
    });

    test('warns on undefined variable inside function body', () => {
      const source = `let f = fun() {
  unknown
}`;
      const { ast } = parse(source);
      const result = analyze(ast);
      const warnings = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Warning
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0].message).toContain('unknown');
    });
  });

  describe('unused variable declaration hints', () => {
    test('hints on unused variable', () => {
      const { ast } = parse('let x = 1');
      const result = analyze(ast);
      const hints = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Hint
      );
      expect(hints.length).toBe(1);
      expect(hints[0].message).toContain('x');
      expect(hints[0].source).toBe('catspeak');
    });

    test('no hint for used variable', () => {
      const source = `let x = 1
x`;
      const { ast } = parse(source);
      const result = analyze(ast);
      const hints = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Hint
      );
      expect(hints).toHaveLength(0);
    });

    test('hints on unused function parameter', () => {
      const source = `let f = fun(a) {
  1
}
f`;
      const { ast } = parse(source);
      const result = analyze(ast);
      const hints = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Hint
      );
      const paramHint = hints.find(h => h.message.includes('a'));
      expect(paramHint).toBeDefined();
    });

    test('no hint for used parameter', () => {
      const source = `let f = fun(a) {
  a
}
f`;
      const { ast } = parse(source);
      const result = analyze(ast);
      const hints = result.diagnostics.filter(
        d => d.severity === DiagnosticSeverity.Hint
      );
      // No unused hints (f is used, a is used)
      expect(hints).toHaveLength(0);
    });
  });

  describe('all diagnostics have source catspeak', () => {
    test('all diagnostics have source set to catspeak', () => {
      const parseResult = parse('let = 1\nunknown_var');
      const result = analyze(parseResult.ast, parseResult.errors);
      for (const diag of result.diagnostics) {
        expect(diag.source).toBe('catspeak');
      }
    });
  });
});
