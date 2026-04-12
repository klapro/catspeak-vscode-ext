import { CatspeakSymbol } from './analyzer';
import { SymbolIndex, IndexedSymbol } from './symbolIndex';

function makeSymbol(name: string, kind: CatspeakSymbol['kind'] = 'Variable'): CatspeakSymbol {
  return {
    name,
    kind,
    range: { start: { line: 0, character: 0 }, end: { line: 0, character: name.length } },
    declarationRange: { start: { line: 0, character: 0 }, end: { line: 0, character: name.length + 6 } },
  };
}

describe('SymbolIndex', () => {
  let index: SymbolIndex;

  beforeEach(() => {
    index = new SymbolIndex();
  });

  // --- indexDocument ---

  test('indexDocument stores symbols for a document', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('x')]);
    const syms = index.getDocumentSymbols('file:///a.meow');
    expect(syms).toHaveLength(1);
    expect(syms[0].name).toBe('x');
  });

  test('indexDocument replaces existing symbols on re-index', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('x')]);
    index.indexDocument('file:///a.meow', [makeSymbol('y'), makeSymbol('z')]);
    const syms = index.getDocumentSymbols('file:///a.meow');
    expect(syms).toHaveLength(2);
    expect(syms.map(s => s.name).sort()).toEqual(['y', 'z']);
  });

  test('indexed symbols include documentUri', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('x')]);
    const syms = index.getDocumentSymbols('file:///a.meow');
    expect(syms[0].documentUri).toBe('file:///a.meow');
  });

  // --- removeDocument ---

  test('removeDocument removes all symbols for a document', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('x')]);
    index.removeDocument('file:///a.meow');
    expect(index.getDocumentSymbols('file:///a.meow')).toHaveLength(0);
  });

  test('removeDocument is a no-op for unknown URI', () => {
    index.removeDocument('file:///unknown.meow');
    expect(index.getAllSymbols()).toHaveLength(0);
  });

  // --- getDocumentSymbols ---

  test('getDocumentSymbols returns empty array for unknown URI', () => {
    expect(index.getDocumentSymbols('file:///nope.meow')).toEqual([]);
  });

  // --- getAllSymbols ---

  test('getAllSymbols returns symbols from all documents', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('x')]);
    index.indexDocument('file:///b.meow', [makeSymbol('y'), makeSymbol('z', 'Function')]);
    const all = index.getAllSymbols();
    expect(all).toHaveLength(3);
    expect(all.map(s => s.name).sort()).toEqual(['x', 'y', 'z']);
  });

  test('getAllSymbols returns empty array when nothing is indexed', () => {
    expect(index.getAllSymbols()).toEqual([]);
  });

  test('getAllSymbols reflects removals', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('x')]);
    index.indexDocument('file:///b.meow', [makeSymbol('y')]);
    index.removeDocument('file:///a.meow');
    const all = index.getAllSymbols();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('y');
  });

  // --- findSymbol (exact match) ---

  test('findSymbol returns exact name matches across documents', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('greet', 'Function')]);
    index.indexDocument('file:///b.meow', [makeSymbol('greet', 'Variable'), makeSymbol('hello')]);
    const results = index.findSymbol('greet');
    expect(results).toHaveLength(2);
    expect(results.every(s => s.name === 'greet')).toBe(true);
  });

  test('findSymbol is case-sensitive', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('Greet'), makeSymbol('greet')]);
    expect(index.findSymbol('greet')).toHaveLength(1);
    expect(index.findSymbol('Greet')).toHaveLength(1);
    expect(index.findSymbol('GREET')).toHaveLength(0);
  });

  test('findSymbol returns empty array when no match', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('x')]);
    expect(index.findSymbol('y')).toEqual([]);
  });

  // --- findSymbolFuzzy ---

  test('findSymbolFuzzy returns all symbols for empty query', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('x'), makeSymbol('y')]);
    expect(index.findSymbolFuzzy('')).toHaveLength(2);
  });

  test('findSymbolFuzzy matches case-insensitively', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('GreetUser')]);
    const results = index.findSymbolFuzzy('greetuser');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('GreetUser');
  });

  test('findSymbolFuzzy matches substrings', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('myGreetFunction')]);
    const results = index.findSymbolFuzzy('Greet');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('myGreetFunction');
  });

  test('findSymbolFuzzy supports character-by-character fuzzy matching', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('greetFunction')]);
    const results = index.findSymbolFuzzy('grFn');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('greetFunction');
  });

  test('findSymbolFuzzy sorts by relevance: exact > prefix > substring > fuzzy', () => {
    index.indexDocument('file:///a.meow', [
      makeSymbol('myFooBar'),       // substring match
      makeSymbol('foo'),            // exact match (case-insensitive)
      makeSymbol('fooExtra'),       // prefix match
      makeSymbol('fxoxo'),          // fuzzy match
    ]);
    const results = index.findSymbolFuzzy('foo');
    expect(results.map(s => s.name)).toEqual([
      'foo',        // exact
      'fooExtra',   // prefix
      'myFooBar',   // substring
      'fxoxo',      // fuzzy
    ]);
  });

  test('findSymbolFuzzy excludes non-matching symbols', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('abc'), makeSymbol('xyz')]);
    const results = index.findSymbolFuzzy('abc');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('abc');
  });

  test('findSymbolFuzzy includes documentUri on results', () => {
    index.indexDocument('file:///a.meow', [makeSymbol('hello')]);
    const results = index.findSymbolFuzzy('hello');
    expect(results[0].documentUri).toBe('file:///a.meow');
  });
});
