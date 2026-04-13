/**
 * Catspeak Recursive Descent Parser
 * Builds an AST from a token stream produced by the lexer.
 */

import { Token, TokenType, Range, Position, tokenize } from './lexer';
import {
  ASTNode,
  ProgramNode,
  LetDeclarationNode,
  FunctionExpressionNode,
  CallExpressionNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  IdentifierNode,
  LiteralNode,
  IfStatementNode,
  WhileStatementNode,
  ForStatementNode,
  ReturnStatementNode,
  BreakStatementNode,
  ContinueStatementNode,
  MemberExpressionNode,
  AssignmentExpressionNode,
  BlockExpressionNode,
  ExpressionStatementNode,
  StructExpressionNode,
  StructProperty,
  ParseError,
  ParseResult,
} from './ast';

export function parse(source: string): ParseResult {
  const tokens = tokenize(source);
  const errors: ParseError[] = [];
  let pos = 0;

  function current(): Token {
    return tokens[pos];
  }

  function peek(): Token {
    return tokens[pos];
  }

  function peekType(): TokenType {
    return current().type;
  }

  function peekValue(): string {
    return current().value;
  }

  function isAtEnd(): boolean {
    return peekType() === 'EOF';
  }

  function advance(): Token {
    const tok = current();
    if (!isAtEnd()) pos++;
    return tok;
  }

  function skipNewlines(): void {
    while (peekType() === 'Newline' || peekType() === 'Comment') {
      advance();
    }
  }

  function expect(type: TokenType, value?: string): Token {
    const tok = current();
    if (tok.type !== type || (value !== undefined && tok.value !== value)) {
      const expected = value ? `'${value}'` : type;
      addError(`Expected ${expected}, got '${tok.value}'`, tok.range);
      // Return the current token anyway for error recovery
      return tok;
    }
    return advance();
  }

  function expectValue(value: string): Token {
    const tok = current();
    if (tok.value !== value) {
      addError(`Expected '${value}', got '${tok.value}'`, tok.range);
      return tok;
    }
    return advance();
  }

  function match(type: TokenType, value?: string): boolean {
    if (current().type === type && (value === undefined || current().value === value)) {
      return true;
    }
    return false;
  }

  function check(type: TokenType, value?: string): boolean {
    return current().type === type && (value === undefined || current().value === value);
  }

  function consume(type: TokenType, value?: string): Token | null {
    if (match(type, value)) {
      return advance();
    }
    return null;
  }

  function addError(message: string, range: Range): void {
    errors.push({ message, range });
  }

  function makeRange(start: Position, end: Position): Range {
    return { start, end };
  }

  /** Synchronize after an error by skipping to a recovery point */
  function synchronize(): void {
    while (!isAtEnd()) {
      const t = current();
      // Stop at statement boundaries
      if (t.type === 'Newline') {
        advance();
        return;
      }
      if (t.type === 'Punctuation' && (t.value === ';' || t.value === '}')) {
        advance();
        return;
      }
      if (t.type === 'Keyword' && (
        t.value === 'let' || t.value === 'fun' || t.value === 'if' ||
        t.value === 'while' || t.value === 'for' || t.value === 'return' ||
        t.value === 'break' || t.value === 'continue'
      )) {
        return; // Don't consume the keyword
      }
      advance();
    }
  }

  // ---- Top-level parsing ----

  function parseProgram(): ProgramNode {
    const start = current().range.start;
    const body: ASTNode[] = [];

    skipNewlines();
    while (!isAtEnd()) {
      try {
        const stmt = parseStatement();
        if (stmt) body.push(stmt);
      } catch {
        synchronize();
      }
      skipNewlines();
    }

    return {
      type: 'Program',
      body,
      children: body,
      range: makeRange(start, current().range.end),
    };
  }

  function parseStatement(): ASTNode | null {
    skipNewlines();
    if (isAtEnd()) return null;

    const tok = current();

    if (tok.type === 'Keyword') {
      switch (tok.value) {
        case 'let': return parseLetDeclaration();
        case 'if': return parseIfStatement();
        case 'while': return parseWhileStatement();
        case 'for': return parseForStatement();
        case 'return': return parseReturnStatement();
        case 'break': return parseBreakStatement();
        case 'continue': return parseContinueStatement();
        default: break;
      }
    }

    // Expression statement
    return parseExpressionStatement();
  }

  function parseExpressionStatement(): ExpressionStatementNode {
    const expr = parseExpression();
    // Consume optional semicolons/newlines
    consumeStatementTerminator();
    return {
      type: 'ExpressionStatement',
      expression: expr,
      children: [expr],
      range: expr.range,
    };
  }

  function consumeStatementTerminator(): void {
    consume('Punctuation', ';');
    // Newlines are consumed by skipNewlines in the main loop
  }

  // ---- Statement parsers ----

  function parseLetDeclaration(): LetDeclarationNode {
    const start = current().range.start;
    advance(); // consume 'let'
    skipNewlines();

    const name = parseIdentifier();
    skipNewlines();

    let value: ASTNode | null = null;
    if (check('Operator', '=')) {
      advance(); // consume '='
      skipNewlines();
      value = parseExpression();
    }

    consumeStatementTerminator();

    const children: ASTNode[] = [name];
    if (value) children.push(value);

    return {
      type: 'LetDeclaration',
      name,
      value,
      children,
      range: makeRange(start, current().range.start),
    };
  }

  function parseIfStatement(): IfStatementNode {
    const start = current().range.start;
    advance(); // consume 'if'
    skipNewlines();

    const condition = parseExpression();
    skipNewlines();
    const consequent = parseBlockOrStatement();
    skipNewlines();

    let alternate: ASTNode | null = null;
    if (check('Keyword', 'else')) {
      advance(); // consume 'else'
      skipNewlines();
      if (check('Keyword', 'if')) {
        alternate = parseIfStatement();
      } else {
        alternate = parseBlockOrStatement();
      }
    }

    const children: ASTNode[] = [condition, consequent];
    if (alternate) children.push(alternate);

    return {
      type: 'IfStatement',
      condition,
      consequent,
      alternate,
      children,
      range: makeRange(start, current().range.start),
    };
  }

  function parseWhileStatement(): WhileStatementNode {
    const start = current().range.start;
    advance(); // consume 'while'
    skipNewlines();

    const condition = parseExpression();
    skipNewlines();
    const body = parseBlockOrStatement();

    return {
      type: 'WhileStatement',
      condition,
      body,
      children: [condition, body],
      range: makeRange(start, current().range.start),
    };
  }

  function parseForStatement(): ForStatementNode {
    const start = current().range.start;
    advance(); // consume 'for'
    skipNewlines();

    const variable = parseIdentifier();
    skipNewlines();

    // Expect 'in' keyword or some separator — Catspeak uses 'in' for iteration
    // If there's no 'in', just parse the iterable
    if (check('Identifier') && peekValue() === 'in') {
      advance(); // consume 'in'
    }
    skipNewlines();

    const iterable = parseExpression();
    skipNewlines();
    const body = parseBlockOrStatement();

    return {
      type: 'ForStatement',
      variable,
      iterable,
      body,
      children: [variable, iterable, body],
      range: makeRange(start, current().range.start),
    };
  }

  function parseReturnStatement(): ReturnStatementNode {
    const start = current().range.start;
    advance(); // consume 'return'

    let argument: ASTNode | null = null;
    // If the next token is on the same line and not a terminator, parse the argument
    if (!isAtEnd() && !check('Newline') && !check('Punctuation', ';') && !check('Punctuation', '}')) {
      argument = parseExpression();
    }

    consumeStatementTerminator();

    const children: ASTNode[] = argument ? [argument] : [];
    return {
      type: 'ReturnStatement',
      argument,
      children,
      range: makeRange(start, current().range.start),
    };
  }

  function parseBreakStatement(): BreakStatementNode {
    const start = current().range.start;
    const tok = advance(); // consume 'break'
    consumeStatementTerminator();
    return {
      type: 'BreakStatement',
      children: [],
      range: makeRange(start, tok.range.end),
    };
  }

  function parseContinueStatement(): ContinueStatementNode {
    const start = current().range.start;
    const tok = advance(); // consume 'continue'
    consumeStatementTerminator();
    return {
      type: 'ContinueStatement',
      children: [],
      range: makeRange(start, tok.range.end),
    };
  }

  // ---- Block parsing ----

  function parseBlockOrStatement(): ASTNode {
    if (check('Punctuation', '{')) {
      return parseBlock();
    }
    const stmt = parseStatement();
    return stmt ?? createErrorNode();
  }

  function parseBlock(): BlockExpressionNode {
    const start = current().range.start;
    expect('Punctuation', '{');
    skipNewlines();

    const body: ASTNode[] = [];
    while (!isAtEnd() && !check('Punctuation', '}')) {
      const stmt = parseStatement();
      if (stmt) body.push(stmt);
      skipNewlines();
    }

    expect('Punctuation', '}');

    return {
      type: 'BlockExpression',
      body,
      children: body,
      range: makeRange(start, current().range.start),
    };
  }

  /**
   * Determine if { starts a struct literal or a block expression.
   */
  function parseBlockOrStruct(): ASTNode {
    const savedPos = pos;
    const start = current().range.start;
    advance(); // consume '{'
    skipNewlines();

    // Empty {} — treat as empty struct
    if (check('Punctuation', '}')) {
      advance();
      return {
        type: 'StructExpression',
        properties: [],
        children: [],
        range: makeRange(start, current().range.start),
      } as StructExpressionNode;
    }

    // Check if it looks like a struct: identifier/keyword followed by :
    if ((current().type === 'Identifier' || current().type === 'Keyword') && isStructStart()) {
      pos = savedPos;
      return parseStructExpression();
    }

    // It's a block — we already consumed { and skipped newlines
    const body: ASTNode[] = [];
    while (!isAtEnd() && !check('Punctuation', '}')) {
      const stmt = parseStatement();
      if (stmt) body.push(stmt);
      skipNewlines();
    }
    expect('Punctuation', '}');
    return {
      type: 'BlockExpression',
      body,
      children: body,
      range: makeRange(start, current().range.start),
    } as BlockExpressionNode;
  }

  function isStructStart(): boolean {
    const saved = pos;
    advance(); // skip identifier/keyword
    while (pos < tokens.length && current().type === 'Newline') advance();
    const result = check('Punctuation', ':');
    pos = saved;
    return result;
  }

  function parseStructExpression(): StructExpressionNode {
    const start = current().range.start;
    expect('Punctuation', '{');
    skipNewlines();

    const properties: StructProperty[] = [];
    const children: ASTNode[] = [];

    while (!isAtEnd() && !check('Punctuation', '}')) {
      const keyTok = current();
      let key: IdentifierNode;
      if (keyTok.type === 'Identifier' || keyTok.type === 'Keyword') {
        advance();
        key = {
          type: 'Identifier',
          name: keyTok.value,
          children: [],
          range: keyTok.range,
        };
      } else {
        addError(`Expected property name, got '${keyTok.value}'`, keyTok.range);
        synchronize();
        skipNewlines();
        continue;
      }

      skipNewlines();
      expect('Punctuation', ':');
      skipNewlines();

      const value = parseExpression();
      properties.push({ key, value });
      children.push(key, value);

      skipNewlines();
      consume('Punctuation', ',');
      skipNewlines();
    }

    expect('Punctuation', '}');

    return {
      type: 'StructExpression',
      properties,
      children,
      range: makeRange(start, current().range.start),
    };
  }

  function createErrorNode(): ASTNode {
    const range = current().range;
    return {
      type: 'Literal',
      range,
      children: [],
      value: 'undefined',
      literalType: 'undefined',
    } as LiteralNode;
  }

  // ---- Expression parsing (precedence climbing) ----

  function parseExpression(): ASTNode {
    return parseAssignment();
  }

  function parseAssignment(): ASTNode {
    const left = parseOr();

    if (check('Operator') && isAssignmentOp(peekValue())) {
      const op = advance().value;
      skipNewlines();
      const right = parseAssignment(); // right-associative
      return {
        type: 'AssignmentExpression',
        operator: op,
        left,
        right,
        children: [left, right],
        range: makeRange(left.range.start, right.range.end),
      } as AssignmentExpressionNode;
    }

    return left;
  }

  function isAssignmentOp(op: string): boolean {
    return op === '=' || op === '+=' || op === '-=' || op === '*=' || op === '/=';
  }

  function parseOr(): ASTNode {
    let left = parseXor();
    while (check('Keyword', 'or')) {
      const op = advance().value;
      skipNewlines();
      const right = parseXor();
      left = makeBinary(op, left, right);
    }
    return left;
  }

  function parseXor(): ASTNode {
    let left = parseAnd();
    while (check('Keyword', 'xor')) {
      const op = advance().value;
      skipNewlines();
      const right = parseAnd();
      left = makeBinary(op, left, right);
    }
    return left;
  }

  function parseAnd(): ASTNode {
    let left = parseEquality();
    while (check('Keyword', 'and')) {
      const op = advance().value;
      skipNewlines();
      const right = parseEquality();
      left = makeBinary(op, left, right);
    }
    return left;
  }

  function parseEquality(): ASTNode {
    let left = parseComparison();
    while (check('Operator') && (peekValue() === '==' || peekValue() === '!=')) {
      const op = advance().value;
      skipNewlines();
      const right = parseComparison();
      left = makeBinary(op, left, right);
    }
    return left;
  }

  function parseComparison(): ASTNode {
    let left = parsePipe();
    while (check('Operator') && (peekValue() === '<' || peekValue() === '<=' || peekValue() === '>' || peekValue() === '>=')) {
      const op = advance().value;
      skipNewlines();
      const right = parsePipe();
      left = makeBinary(op, left, right);
    }
    return left;
  }

  function parsePipe(): ASTNode {
    let left = parseBitwise();
    while (check('Operator') && (peekValue() === '<|' || peekValue() === '|>')) {
      const op = advance().value;
      skipNewlines();
      const right = parseBitwise();
      left = makeBinary(op, left, right);
    }
    return left;
  }

  function parseBitwise(): ASTNode {
    let left = parseShift();
    while (check('Operator') && (peekValue() === '&' || peekValue() === '|' || peekValue() === '^')) {
      const op = advance().value;
      skipNewlines();
      const right = parseShift();
      left = makeBinary(op, left, right);
    }
    return left;
  }

  function parseShift(): ASTNode {
    let left = parseAdditive();
    while (check('Operator') && (peekValue() === '<<' || peekValue() === '>>')) {
      const op = advance().value;
      skipNewlines();
      const right = parseAdditive();
      left = makeBinary(op, left, right);
    }
    return left;
  }

  function parseAdditive(): ASTNode {
    let left = parseMultiplicative();
    while (isBinOpAhead('+', '-')) {
      skipNewlines();
      const op = advance().value;
      skipNewlines();
      const right = parseMultiplicative();
      left = makeBinary(op, left, right);
    }
    return left;
  }

  function parseMultiplicative(): ASTNode {
    let left = parseUnary();
    while (check('Operator') && (peekValue() === '*' || peekValue() === '/' || peekValue() === '//' || peekValue() === '%')) {
      const op = advance().value;
      skipNewlines();
      const right = parseUnary();
      left = makeBinary(op, left, right);
    }
    return left;
  }

  /**
   * Peek past newlines to check if a binary operator is ahead.
   * This allows multi-line expressions like:
   *   "hello"
   *   + " world"
   */
  function isBinOpAhead(...ops: string[]): boolean {
    // First check without skipping newlines
    if (check('Operator') && ops.includes(peekValue())) return true;
    // Peek past newlines
    let ahead = pos;
    while (ahead < tokens.length && tokens[ahead].type === 'Newline') ahead++;
    if (ahead < tokens.length && tokens[ahead].type === 'Operator' && ops.includes(tokens[ahead].value)) {
      return true;
    }
    return false;
  }

  function makeBinary(op: string, left: ASTNode, right: ASTNode): BinaryExpressionNode {
    return {
      type: 'BinaryExpression',
      operator: op,
      left,
      right,
      children: [left, right],
      range: makeRange(left.range.start, right.range.end),
    };
  }

  function parseUnary(): ASTNode {
    if (check('Operator') && (peekValue() === '!' || peekValue() === '~' || peekValue() === '-')) {
      const start = current().range.start;
      const op = advance().value;
      skipNewlines();
      const operand = parseUnary();
      return {
        type: 'UnaryExpression',
        operator: op,
        operand,
        children: [operand],
        range: makeRange(start, operand.range.end),
      } as UnaryExpressionNode;
    }
    return parseCallAndMember();
  }

  function parseCallAndMember(): ASTNode {
    let expr = parsePrimary();

    while (true) {
      if (check('Punctuation', '(')) {
        expr = parseCallExpression(expr);
      } else if (check('Punctuation', '.')) {
        expr = parseMemberExpression(expr);
      } else if (check('Punctuation', '[')) {
        expr = parseComputedMember(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  function parseCallExpression(callee: ASTNode): CallExpressionNode {
    advance(); // consume '('
    skipNewlines();

    const args: ASTNode[] = [];
    if (!check('Punctuation', ')')) {
      args.push(parseExpression());
      while (check('Punctuation', ',')) {
        advance(); // consume ','
        skipNewlines();
        args.push(parseExpression());
      }
    }
    skipNewlines();
    const end = expect('Punctuation', ')');

    return {
      type: 'CallExpression',
      callee,
      args,
      children: [callee, ...args],
      range: makeRange(callee.range.start, end.range.end),
    };
  }

  function parseMemberExpression(object: ASTNode): MemberExpressionNode {
    advance(); // consume '.'
    skipNewlines();
    const property = parseIdentifier();

    return {
      type: 'MemberExpression',
      object,
      property,
      children: [object, property],
      range: makeRange(object.range.start, property.range.end),
    };
  }

  function parseComputedMember(object: ASTNode): CallExpressionNode {
    // Treat computed member access obj[expr] as a call-like node for simplicity
    const start = object.range.start;
    advance(); // consume '['
    skipNewlines();
    const index = parseExpression();
    skipNewlines();
    const end = expect('Punctuation', ']');

    return {
      type: 'CallExpression',
      callee: object,
      args: [index],
      children: [object, index],
      range: makeRange(start, end.range.end),
    };
  }

  // ---- Primary expressions ----

  function parsePrimary(): ASTNode {
    const tok = current();

    // Fun expression
    if (tok.type === 'Keyword' && tok.value === 'fun') {
      return parseFunctionExpression();
    }

    // Block or struct expression
    if (tok.type === 'Punctuation' && tok.value === '{') {
      return parseBlockOrStruct();
    }

    // Parenthesized expression
    if (tok.type === 'Punctuation' && tok.value === '(') {
      advance(); // consume '('
      skipNewlines();
      const expr = parseExpression();
      skipNewlines();
      expect('Punctuation', ')');
      return expr;
    }

    // Literals
    if (tok.type === 'Number') {
      advance();
      const literalType = tok.value.startsWith('#') ? 'colour' as const : 'number' as const;
      return {
        type: 'Literal',
        value: tok.value,
        literalType,
        children: [],
        range: tok.range,
      } as LiteralNode;
    }

    if (tok.type === 'String') {
      advance();
      return {
        type: 'Literal',
        value: tok.value,
        literalType: 'string',
        children: [],
        range: tok.range,
      } as LiteralNode;
    }

    // Boolean / undefined / special keyword literals
    if (tok.type === 'Keyword' && (tok.value === 'true' || tok.value === 'false')) {
      advance();
      return {
        type: 'Literal',
        value: tok.value,
        literalType: 'boolean',
        children: [],
        range: tok.range,
      } as LiteralNode;
    }

    if (tok.type === 'Keyword' && (tok.value === 'undefined' || tok.value === 'infinity' || tok.value === 'NaN')) {
      advance();
      return {
        type: 'Literal',
        value: tok.value,
        literalType: tok.value === 'undefined' ? 'undefined' : 'number',
        children: [],
        range: tok.range,
      } as LiteralNode;
    }

    // Self / other as identifiers
    if (tok.type === 'Keyword' && (tok.value === 'self' || tok.value === 'other' || tok.value === 'new')) {
      advance();
      return {
        type: 'Identifier',
        name: tok.value,
        children: [],
        range: tok.range,
      } as IdentifierNode;
    }

    // Identifier
    if (tok.type === 'Identifier') {
      return parseIdentifier();
    }

    // If we get here, it's an unexpected token
    addError(`Unexpected token '${tok.value}'`, tok.range);
    advance();
    return createErrorNode();
  }

  function parseFunctionExpression(): FunctionExpressionNode {
    const start = current().range.start;
    advance(); // consume 'fun'
    skipNewlines();

    // Parse parameters
    const params: IdentifierNode[] = [];
    if (check('Punctuation', '(')) {
      advance(); // consume '('
      skipNewlines();
      if (!check('Punctuation', ')')) {
        params.push(parseIdentifier());
        while (check('Punctuation', ',')) {
          advance(); // consume ','
          skipNewlines();
          params.push(parseIdentifier());
        }
      }
      skipNewlines();
      expect('Punctuation', ')');
      skipNewlines();
    }

    const body = parseBlockOrStatement();

    return {
      type: 'FunctionExpression',
      params,
      body,
      children: [...params, body],
      range: makeRange(start, body.range.end),
    };
  }

  function parseIdentifier(): IdentifierNode {
    const tok = current();
    if (tok.type === 'Identifier') {
      advance();
      return {
        type: 'Identifier',
        name: tok.value,
        children: [],
        range: tok.range,
      };
    }
    // Error recovery: create an error identifier
    addError(`Expected identifier, got '${tok.value}'`, tok.range);
    advance();
    return {
      type: 'Identifier',
      name: '<error>',
      children: [],
      range: tok.range,
    };
  }

  // ---- Run the parser ----
  const ast = parseProgram();

  return { ast, errors, tokens };
}
