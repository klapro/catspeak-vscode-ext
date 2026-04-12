import { formatDocument, formatRange } from './formatter';

describe('Formatter', () => {
  describe('indentation', () => {
    it('applies 2-space indentation inside blocks', () => {
      const input = 'if x {\ny = 1\n}';
      const result = formatDocument(input);
      expect(result).toBe('if x {\n  y = 1\n}\n');
    });

    it('handles nested blocks', () => {
      const input = 'if x {\nif y {\nz = 1\n}\n}';
      const result = formatDocument(input);
      expect(result).toBe('if x {\n  if y {\n    z = 1\n  }\n}\n');
    });

    it('respects configurable indent size', () => {
      const input = 'if x {\ny = 1\n}';
      const result = formatDocument(input, { indentSize: 4 });
      expect(result).toBe('if x {\n    y = 1\n}\n');
    });

    it('supports tabs', () => {
      const input = 'if x {\ny = 1\n}';
      const result = formatDocument(input, { useTabs: true });
      expect(result).toBe('if x {\n\ty = 1\n}\n');
    });
  });

  describe('operator whitespace', () => {
    it('normalizes spaces around binary operators', () => {
      const input = 'x=1+2';
      const result = formatDocument(input);
      expect(result).toBe('x = 1 + 2\n');
    });

    it('normalizes spaces around comparison operators', () => {
      const input = 'x>=1';
      const result = formatDocument(input);
      expect(result).toBe('x >= 1\n');
    });

    it('handles keyword operators (and, or, xor)', () => {
      const input = 'a and b or c';
      const result = formatDocument(input);
      expect(result).toBe('a and b or c\n');
    });

    it('does not add space after unary operators', () => {
      const input = '!x';
      const result = formatDocument(input);
      expect(result).toBe('!x\n');
    });

    it('handles unary minus', () => {
      const input = 'let x = -1';
      const result = formatDocument(input);
      expect(result).toBe('let x = -1\n');
    });
  });

  describe('preserving comments', () => {
    it('preserves comment content', () => {
      const input = '-- this is a comment\nlet x = 1';
      const result = formatDocument(input);
      expect(result).toBe('-- this is a comment\nlet x = 1\n');
    });

    it('preserves inline comments', () => {
      const input = 'let x = 1 -- inline comment';
      const result = formatDocument(input);
      expect(result).toBe('let x = 1 -- inline comment\n');
    });
  });

  describe('preserving strings', () => {
    it('preserves string literal content', () => {
      const input = 'let x = "hello world"';
      const result = formatDocument(input);
      expect(result).toBe('let x = "hello world"\n');
    });

    it('preserves escape sequences in strings', () => {
      const input = 'let x = "line1\\nline2"';
      const result = formatDocument(input);
      expect(result).toBe('let x = "line1\\nline2"\n');
    });

    it('preserves raw strings', () => {
      const input = 'let x = @"raw string"';
      const result = formatDocument(input);
      expect(result).toBe('let x = @"raw string"\n');
    });
  });

  describe('block formatting', () => {
    it('formats function expressions with blocks', () => {
      const input = 'let f = fun(x) {\nreturn x + 1\n}';
      const result = formatDocument(input);
      expect(result).toBe('let f = fun(x) {\n  return x + 1\n}\n');
    });

    it('formats while loops', () => {
      const input = 'while x > 0 {\nx = x - 1\n}';
      const result = formatDocument(input);
      expect(result).toBe('while x > 0 {\n  x = x - 1\n}\n');
    });
  });

  describe('blank line preservation', () => {
    it('preserves one blank line between declarations', () => {
      const input = 'let x = 1\n\nlet y = 2';
      const result = formatDocument(input);
      expect(result).toBe('let x = 1\n\nlet y = 2\n');
    });

    it('collapses multiple blank lines to one', () => {
      const input = 'let x = 1\n\n\n\nlet y = 2';
      const result = formatDocument(input);
      expect(result).toBe('let x = 1\n\nlet y = 2\n');
    });
  });

  describe('punctuation formatting', () => {
    it('adds space after commas', () => {
      const input = 'f(a,b,c)';
      const result = formatDocument(input);
      expect(result).toBe('f(a, b, c)\n');
    });

    it('no space around dots', () => {
      const input = 'obj . prop';
      const result = formatDocument(input);
      expect(result).toBe('obj.prop\n');
    });

    it('no space before opening paren after identifier', () => {
      const input = 'f (x)';
      const result = formatDocument(input);
      expect(result).toBe('f(x)\n');
    });
  });

  describe('formatRange', () => {
    it('formats only the specified line range', () => {
      const input = 'let x=1\nif y {\nz=2\n}\nlet w=3';
      const result = formatRange(input, 1, 3);
      // Should format lines 1-3 (the if block) with correct indent context
      expect(result).toContain('if y {');
      expect(result).toContain('  z = 2');
      expect(result).toContain('}');
    });
  });

  describe('complex formatting', () => {
    it('formats a complete program', () => {
      const input = [
        'let add=fun(a,b) {',
        'return a+b',
        '}',
        '',
        '-- call the function',
        'let result=add(1,2)',
      ].join('\n');

      const result = formatDocument(input);
      const expected = [
        'let add = fun(a, b) {',
        '  return a + b',
        '}',
        '',
        '-- call the function',
        'let result = add(1, 2)',
        '',
      ].join('\n');

      expect(result).toBe(expected);
    });
  });
});
