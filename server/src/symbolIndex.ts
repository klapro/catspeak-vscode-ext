/**
 * SymbolIndex — maintains a per-document index of Catspeak symbols
 * for workspace-wide search and retrieval.
 */

import { CatspeakSymbol } from './analyzer';

/** A symbol enriched with the URI of the document it belongs to. */
export interface IndexedSymbol extends CatspeakSymbol {
  documentUri: string;
}

/**
 * Stores symbols keyed by document URI so they can be queried
 * per-document or across the entire workspace.
 */
export class SymbolIndex {
  private documents: Map<string, IndexedSymbol[]> = new Map();

  /**
   * Index (or re-index) symbols for a document.
   * Replaces any previously stored symbols for the given URI.
   */
  indexDocument(uri: string, symbols: CatspeakSymbol[]): void {
    const indexed: IndexedSymbol[] = symbols.map(s => ({ ...s, documentUri: uri }));
    this.documents.set(uri, indexed);
  }

  /** Remove all symbols associated with a document. */
  removeDocument(uri: string): void {
    this.documents.delete(uri);
  }

  /** Retrieve the indexed symbols for a specific document, or an empty array if none. */
  getDocumentSymbols(uri: string): IndexedSymbol[] {
    return this.documents.get(uri) ?? [];
  }

  /** Retrieve all indexed symbols across every document. */
  getAllSymbols(): IndexedSymbol[] {
    const all: IndexedSymbol[] = [];
    for (const syms of this.documents.values()) {
      all.push(...syms);
    }
    return all;
  }

  /** Find symbols whose name exactly matches the given name (case-sensitive). */
  findSymbol(name: string): IndexedSymbol[] {
    const results: IndexedSymbol[] = [];
    for (const syms of this.documents.values()) {
      for (const sym of syms) {
        if (sym.name === name) {
          results.push(sym);
        }
      }
    }
    return results;
  }

  /**
   * Find symbols matching a query using fuzzy matching.
   * Results are sorted by relevance:
   *   1. Exact match (case-insensitive)
   *   2. Prefix match (case-insensitive)
   *   3. Substring match (case-insensitive)
   *   4. Character-by-character fuzzy match (e.g. "grFn" matches "greetFunction")
   */
  findSymbolFuzzy(query: string): IndexedSymbol[] {
    if (query === '') return this.getAllSymbols();

    const lowerQuery = query.toLowerCase();

    const exact: IndexedSymbol[] = [];
    const prefix: IndexedSymbol[] = [];
    const substring: IndexedSymbol[] = [];
    const fuzzy: IndexedSymbol[] = [];

    for (const syms of this.documents.values()) {
      for (const sym of syms) {
        const lowerName = sym.name.toLowerCase();

        if (lowerName === lowerQuery) {
          exact.push(sym);
        } else if (lowerName.startsWith(lowerQuery)) {
          prefix.push(sym);
        } else if (lowerName.includes(lowerQuery)) {
          substring.push(sym);
        } else if (fuzzyMatch(lowerQuery, lowerName)) {
          fuzzy.push(sym);
        }
      }
    }

    return [...exact, ...prefix, ...substring, ...fuzzy];
  }
}

/**
 * Character-by-character fuzzy match.
 * Returns true if every character in `query` appears in `target` in order.
 * Both strings should already be lowercased.
 */
function fuzzyMatch(query: string, target: string): boolean {
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) {
      qi++;
    }
  }
  return qi === query.length;
}
