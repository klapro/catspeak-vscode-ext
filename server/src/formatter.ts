/**
 * Catspeak Code Formatter
 *
 * Formats Catspeak source code by:
 * - Applying consistent indentation (configurable, default 2 spaces per level)
 * - Normalizing whitespace around operators
 * - Preserving comments and string literals
 * - Handling block expressions { } with proper indentation
 * - Preserving empty lines between top-level declarations
 */

import { tokenize, Token, TokenType } from './lexer';

export interface FormatOptions {
  /** Number of spaces per indent level (default: 2) */
  indentSize: number;
  /** Use tabs instead of spaces (default: false) */
  useTabs: boolean;
}

const DEFAULT_OPTIONS: FormatOptions = {
  indentSize: 2,
  useTabs: false,
};

/** Operators that should have a space on each side */
const SPACED_OPERATORS = new Set([
  '+', '-', '*', '/', '//', '%',
  '&', '|', '^', '<<', '>>',
  '<', '<=', '>', '>=', '==', '!=',
  '<|', '|>',
  '=', '+=', '-=', '*=', '/=',
]);

/** Unary-only prefix operators (never binary) */
const UNARY_OPERATORS = new Set(['!', '~']);

/** Keywords that act like binary operators */
const KEYWORD_OPERATORS = new Set(['and', 'or', 'xor']);

/**
 * Format a full Catspeak source string.
 */
export function formatDocument(source: string, options?: Partial<FormatOptions>): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const tokens = tokenize(source);
  return formatTokens(tokens, opts);
}

/**
 * Format a range of source code. The range is specified by start/end lines (0-indexed).
 * Returns the formatted text for just that range.
 */
export function formatRange(
  source: string,
  startLine: number,
  endLine: number,
  options?: Partial<FormatOptions>,
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const tokens = tokenize(source);

  // We need to know the indent level at the start of the range.
  // Walk tokens before the range to compute the indent depth.
  let indentLevel = 0;
  for (const tok of tokens) {
    if (tok.range.start.line >= startLine) break;
    if (tok.type === 'Punctuation' && tok.value === '{') indentLevel++;
    if (tok.type === 'Punctuation' && tok.value === '}') indentLevel = Math.max(0, indentLevel - 1);
  }

  // Filter tokens to those that touch the requested line range
  const rangeTokens = tokens.filter(
    (t) => t.range.start.line >= startLine && t.range.start.line <= endLine,
  );

  // Add an EOF if not present
  if (rangeTokens.length === 0 || rangeTokens[rangeTokens.length - 1].type !== 'EOF') {
    const last = rangeTokens.length > 0 ? rangeTokens[rangeTokens.length - 1] : tokens[tokens.length - 1];
    rangeTokens.push({ type: 'EOF', value: '', range: last.range });
  }

  return formatTokens(rangeTokens, opts, indentLevel);
}

/**
 * Determine if a '-' token at position `index` is a unary minus.
 * It's unary if it appears at the start, or after an operator/punctuation
 * that cannot end an expression (i.e., not ')' or ']').
 */
function isUnaryMinus(tokens: Token[], index: number): boolean {
  // Find the previous non-newline, non-comment token
  let prev: Token | null = null;
  for (let i = index - 1; i >= 0; i--) {
    if (tokens[i].type !== 'Newline' && tokens[i].type !== 'Comment') {
      prev = tokens[i];
      break;
    }
  }
  if (!prev) return true; // start of file
  if (prev.type === 'Operator') return true;
  if (prev.type === 'Punctuation') {
    // After ) or ] it's binary; after everything else it's unary
    return prev.value !== ')' && prev.value !== ']';
  }
  if (prev.type === 'Keyword' && !isExpressionEndKeyword(prev.value)) return true;
  return false;
}

function isExpressionEndKeyword(value: string): boolean {
  return value === 'true' || value === 'false' || value === 'undefined' ||
    value === 'infinity' || value === 'NaN' || value === 'self' || value === 'other';
}

/**
 * Core formatting logic operating on a token array.
 */
function formatTokens(tokens: Token[], opts: FormatOptions, initialIndent: number = 0): string {
  const indent = opts.useTabs ? '\t' : ' '.repeat(opts.indentSize);
  let depth = initialIndent;
  const lines: string[] = [];
  let currentLine = '';
  let consecutiveNewlines = 0;

  function indentStr(): string {
    return indent.repeat(depth);
  }

  function pushLine(content: string): void {
    if (content.trim() === '') {
      lines.push('');
    } else {
      lines.push(content);
    }
    currentLine = '';
  }

  function startNewLine(): void {
    if (currentLine.trim() !== '') {
      pushLine(currentLine);
    }
    currentLine = indentStr();
  }

  // Initialize the first line
  currentLine = indentStr();

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    if (tok.type === 'EOF') break;

    // Handle newlines: preserve at most one blank line between declarations
    if (tok.type === 'Newline') {
      consecutiveNewlines++;
      if (consecutiveNewlines === 1) {
        // End the current line
        if (currentLine.trim() !== '') {
          pushLine(currentLine);
          currentLine = indentStr();
        }
      } else if (consecutiveNewlines === 2) {
        // Preserve one blank line
        pushLine('');
        currentLine = indentStr();
      }
      // More than 2 consecutive newlines are collapsed to one blank line
      continue;
    }

    consecutiveNewlines = 0;

    // Handle comments — preserve content, place on own line or end of line
    if (tok.type === 'Comment') {
      if (currentLine.trim() === '') {
        currentLine = indentStr() + tok.value;
      } else {
        currentLine += ' ' + tok.value;
      }
      continue;
    }

    // Handle closing brace — decrease indent before writing
    if (tok.type === 'Punctuation' && tok.value === '}') {
      depth = Math.max(0, depth - 1);
      // Put } on its own line
      if (currentLine.trim() !== '') {
        pushLine(currentLine);
      }
      currentLine = indentStr() + '}';
      continue;
    }

    // Handle opening brace — write it, then increase indent
    if (tok.type === 'Punctuation' && tok.value === '{') {
      // Ensure space before {
      if (currentLine.trim() !== '') {
        if (!currentLine.endsWith(' ')) {
          currentLine += ' ';
        }
        currentLine += '{';
      } else {
        currentLine = indentStr() + '{';
      }
      depth++;
      // Start a new line after {
      pushLine(currentLine);
      currentLine = indentStr();
      continue;
    }

    // Handle operators — normalize spacing
    if (tok.type === 'Operator') {
      if (UNARY_OPERATORS.has(tok.value)) {
        // Unary operators: no space after, but space before if needed
        if (currentLine.trim() !== '' && !currentLine.endsWith(' ') && !currentLine.endsWith('(')) {
          currentLine += ' ';
        }
        currentLine += tok.value;
        continue;
      }

      if (tok.value === '-' && isUnaryMinus(tokens, i)) {
        // Unary minus
        if (currentLine.trim() !== '' && !currentLine.endsWith(' ') && !currentLine.endsWith('(')) {
          currentLine += ' ';
        }
        currentLine += '-';
        continue;
      }

      if (SPACED_OPERATORS.has(tok.value)) {
        // Binary operator: space on each side
        if (currentLine.trim() !== '' && !currentLine.endsWith(' ')) {
          currentLine += ' ';
        }
        currentLine += tok.value + ' ';
        continue;
      }

      // Fallback for any other operator
      currentLine += tok.value;
      continue;
    }

    // Handle keyword operators (and, or, xor) — space on each side
    if (tok.type === 'Keyword' && KEYWORD_OPERATORS.has(tok.value)) {
      if (currentLine.trim() !== '' && !currentLine.endsWith(' ')) {
        currentLine += ' ';
      }
      currentLine += tok.value + ' ';
      continue;
    }

    // Handle punctuation
    if (tok.type === 'Punctuation') {
      if (tok.value === ',') {
        currentLine += ', ';
        continue;
      }
      if (tok.value === ';') {
        // Semicolons end a statement — we just skip them since we use newlines
        continue;
      }
      if (tok.value === '.' || tok.value === ':') {
        // No spaces around dot or colon
        // Remove trailing space before dot
        if (currentLine.endsWith(' ')) {
          currentLine = currentLine.slice(0, -1);
        }
        currentLine += tok.value;
        continue;
      }
      if (tok.value === '(' || tok.value === '[') {
        // Remove trailing space before opening paren/bracket if preceded by identifier
        if (currentLine.endsWith(' ')) {
          // Check if the previous meaningful content is an identifier or )
          const trimmed = currentLine.trimEnd();
          const lastChar = trimmed[trimmed.length - 1];
          if (lastChar && /[a-zA-Z0-9_)`\]]/.test(lastChar)) {
            currentLine = trimmed;
          }
        }
        currentLine += tok.value;
        continue;
      }
      if (tok.value === ')' || tok.value === ']') {
        // Remove trailing space before closing paren/bracket
        if (currentLine.endsWith(' ')) {
          currentLine = currentLine.trimEnd();
        }
        currentLine += tok.value;
        continue;
      }
      currentLine += tok.value;
      continue;
    }

    // Handle keywords, identifiers, strings, numbers — add space separator if needed
    if (currentLine.trim() !== '' && !currentLine.endsWith(' ') &&
        !currentLine.endsWith('(') && !currentLine.endsWith('[') &&
        !currentLine.endsWith('.') && !currentLine.endsWith('!') &&
        !currentLine.endsWith('~') && !currentLine.endsWith('-') &&
        !endsWithUnaryMinus(currentLine)) {
      currentLine += ' ';
    }
    currentLine += tok.value;
  }

  // Flush remaining content
  if (currentLine.trim() !== '') {
    pushLine(currentLine);
  }

  // Join lines and ensure trailing newline
  let result = lines.join('\n');
  if (result.length > 0 && !result.endsWith('\n')) {
    result += '\n';
  }
  return result;
}

/**
 * Check if the current line ends with a unary minus (minus right after operator/punctuation).
 */
function endsWithUnaryMinus(line: string): boolean {
  // If line ends with '-' preceded by an operator or open paren, it's unary
  if (!line.endsWith('-')) return false;
  const beforeMinus = line.slice(0, -1).trimEnd();
  if (beforeMinus.length === 0) return true;
  const last = beforeMinus[beforeMinus.length - 1];
  return '(=[<>!~+*/%&|^,'.includes(last);
}
