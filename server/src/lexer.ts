/**
 * Catspeak Lexer - Tokenizes Catspeak source code into a stream of tokens.
 */

export type TokenType =
  | 'Keyword'
  | 'Identifier'
  | 'String'
  | 'Number'
  | 'Operator'
  | 'Comment'
  | 'Punctuation'
  | 'Newline'
  | 'EOF';

export interface Range {
  start: Position;
  end: Position;
}

export interface Position {
  line: number;
  character: number;
}

export interface Token {
  type: TokenType;
  value: string;
  range: Range;
}

const KEYWORDS = new Set([
  'let', 'fun', 'if', 'else', 'while', 'for', 'return', 'break', 'continue',
  'throw', 'catch', 'do', 'match', 'with', 'new', 'self', 'other',
  'true', 'false', 'undefined', 'infinity', 'NaN',
  'and', 'or', 'xor', 'impl', 'params', 'loop',
]);

// Two-character operators (order matters for matching)
const TWO_CHAR_OPERATORS = new Set([
  '//', '<<', '>>', '<=', '>=', '==', '!=', '<|', '|>',
  '+=', '-=', '*=', '/=',
]);

const SINGLE_CHAR_OPERATORS = new Set([
  '+', '-', '*', '/', '%', '&', '|', '^',
  '<', '>', '=', '!', '~',
]);

const PUNCTUATION = new Set([
  '(', ')', '[', ']', '{', '}', ',', ';', '.', ':',
]);


export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 0;
  let col = 0;

  function currentPos(): Position {
    return { line, character: col };
  }

  function peek(): string {
    return pos < source.length ? source[pos] : '\0';
  }

  function peekAt(offset: number): string {
    const idx = pos + offset;
    return idx < source.length ? source[idx] : '\0';
  }

  function advance(): string {
    const ch = source[pos];
    pos++;
    if (ch === '\n') {
      line++;
      col = 0;
    } else {
      col++;
    }
    return ch;
  }

  function makeToken(type: TokenType, value: string, start: Position): Token {
    return { type, value, range: { start, end: currentPos() } };
  }

  function skipWhitespace(): void {
    while (pos < source.length) {
      const ch = peek();
      if (ch === '\n') {
        const start = currentPos();
        advance();
        tokens.push(makeToken('Newline', '\n', start));
      } else if (ch === ' ' || ch === '\t' || ch === '\r') {
        advance();
      } else {
        break;
      }
    }
  }

  function readComment(): Token {
    const start = currentPos();
    // skip the two dashes
    advance();
    advance();
    let value = '--';
    while (pos < source.length && peek() !== '\n') {
      value += advance();
    }
    return makeToken('Comment', value, start);
  }

  function readString(): Token {
    const start = currentPos();
    advance(); // skip opening "
    let value = '"';
    while (pos < source.length && peek() !== '"') {
      if (peek() === '\\') {
        value += advance(); // backslash
        if (pos < source.length) {
          value += advance(); // escaped char
        }
      } else if (peek() === '\n') {
        break; // unterminated string at newline
      } else {
        value += advance();
      }
    }
    if (peek() === '"') {
      value += advance(); // closing "
    }
    return makeToken('String', value, start);
  }

  function readRawString(): Token {
    const start = currentPos();
    advance(); // skip @
    let value = '@';
    if (peek() === '"') {
      value += advance(); // opening "
      while (pos < source.length && peek() !== '"') {
        if (peek() === '\n') {
          break;
        }
        value += advance();
      }
      if (peek() === '"') {
        value += advance(); // closing "
      }
    }
    return makeToken('String', value, start);
  }

  function readCharLiteral(): Token {
    const start = currentPos();
    advance(); // skip opening '
    let value = "'";
    if (pos < source.length && peek() !== "'") {
      if (peek() === '\\') {
        value += advance(); // backslash
        if (pos < source.length) {
          value += advance(); // escaped char
        }
      } else {
        value += advance();
      }
    }
    if (peek() === "'") {
      value += advance(); // closing '
    }
    return makeToken('String', value, start);
  }

  function readNumber(): Token {
    const start = currentPos();
    let value = '';

    if (peek() === '0' && (peekAt(1) === 'x' || peekAt(1) === 'X')) {
      // Hexadecimal
      value += advance(); // 0
      value += advance(); // x
      while (pos < source.length && (isHexDigit(peek()) || peek() === '_')) {
        value += advance();
      }
    } else if (peek() === '0' && (peekAt(1) === 'b' || peekAt(1) === 'B')) {
      // Binary
      value += advance(); // 0
      value += advance(); // b
      while (pos < source.length && (peek() === '0' || peek() === '1' || peek() === '_')) {
        value += advance();
      }
    } else {
      // Decimal
      while (pos < source.length && (isDigit(peek()) || peek() === '_')) {
        value += advance();
      }
      // Fractional part
      if (peek() === '.' && isDigit(peekAt(1))) {
        value += advance(); // .
        while (pos < source.length && (isDigit(peek()) || peek() === '_')) {
          value += advance();
        }
      }
    }
    return makeToken('Number', value, start);
  }

  function readColourCode(): Token {
    const start = currentPos();
    let value = '#';
    advance(); // skip #
    while (pos < source.length && isHexDigit(peek())) {
      value += advance();
    }
    return makeToken('Number', value, start);
  }

  function readIdentifierOrKeyword(): Token {
    const start = currentPos();
    let value = '';
    while (pos < source.length && isIdentChar(peek())) {
      value += advance();
    }
    const type: TokenType = KEYWORDS.has(value) ? 'Keyword' : 'Identifier';
    return makeToken(type, value, start);
  }

  function readBacktickIdentifier(): Token {
    const start = currentPos();
    advance(); // skip opening `
    let value = '`';
    while (pos < source.length && peek() !== '`') {
      if (peek() === '\n') break;
      value += advance();
    }
    if (peek() === '`') {
      value += advance(); // closing `
    }
    return makeToken('Identifier', value, start);
  }

  while (pos < source.length) {
    skipWhitespace();
    if (pos >= source.length) break;

    const ch = peek();
    const start = currentPos();

    // Comments: --
    if (ch === '-' && peekAt(1) === '-') {
      tokens.push(readComment());
      continue;
    }

    // Raw strings: @"..."
    if (ch === '@' && peekAt(1) === '"') {
      tokens.push(readRawString());
      continue;
    }

    // Strings: "..."
    if (ch === '"') {
      tokens.push(readString());
      continue;
    }

    // Character literals: '...'
    if (ch === "'") {
      tokens.push(readCharLiteral());
      continue;
    }

    // Backtick identifiers: `...`
    if (ch === '`') {
      tokens.push(readBacktickIdentifier());
      continue;
    }

    // Colour codes: #hex
    if (ch === '#' && isHexDigit(peekAt(1))) {
      tokens.push(readColourCode());
      continue;
    }

    // Numbers
    if (isDigit(ch)) {
      tokens.push(readNumber());
      continue;
    }

    // Identifiers and keywords
    if (isIdentStart(ch)) {
      tokens.push(readIdentifierOrKeyword());
      continue;
    }

    // Two-character operators
    const twoChar = ch + peekAt(1);
    if (TWO_CHAR_OPERATORS.has(twoChar)) {
      advance();
      advance();
      tokens.push(makeToken('Operator', twoChar, start));
      continue;
    }

    // Single-character operators
    if (SINGLE_CHAR_OPERATORS.has(ch)) {
      advance();
      tokens.push(makeToken('Operator', ch, start));
      continue;
    }

    // Punctuation
    if (PUNCTUATION.has(ch)) {
      advance();
      tokens.push(makeToken('Punctuation', ch, start));
      continue;
    }

    // Unknown character - skip
    advance();
  }

  tokens.push(makeToken('EOF', '', currentPos()));
  return tokens;
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isHexDigit(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
}

function isIdentStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isIdentChar(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch);
}
