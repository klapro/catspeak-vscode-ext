/**
 * Catspeak AST Node Definitions
 */

import { Range, Token } from './lexer';

export type NodeType =
  | 'Program'
  | 'LetDeclaration'
  | 'FunctionExpression'
  | 'CallExpression'
  | 'BinaryExpression'
  | 'Identifier'
  | 'Literal'
  | 'IfStatement'
  | 'WhileStatement'
  | 'ForStatement'
  | 'ReturnStatement'
  | 'BreakStatement'
  | 'ContinueStatement'
  | 'MemberExpression'
  | 'UnaryExpression'
  | 'AssignmentExpression'
  | 'BlockExpression'
  | 'ExpressionStatement';

export interface ASTNode {
  type: NodeType;
  range: Range;
  children: ASTNode[];
}

export interface ProgramNode extends ASTNode {
  type: 'Program';
  body: ASTNode[];
}

export interface LetDeclarationNode extends ASTNode {
  type: 'LetDeclaration';
  name: IdentifierNode;
  value: ASTNode | null;
}

export interface FunctionExpressionNode extends ASTNode {
  type: 'FunctionExpression';
  params: IdentifierNode[];
  body: ASTNode;
}

export interface CallExpressionNode extends ASTNode {
  type: 'CallExpression';
  callee: ASTNode;
  args: ASTNode[];
}

export interface BinaryExpressionNode extends ASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpressionNode extends ASTNode {
  type: 'UnaryExpression';
  operator: string;
  operand: ASTNode;
}

export interface IdentifierNode extends ASTNode {
  type: 'Identifier';
  name: string;
}

export interface LiteralNode extends ASTNode {
  type: 'Literal';
  value: string;
  literalType: 'string' | 'number' | 'boolean' | 'undefined' | 'colour';
}

export interface IfStatementNode extends ASTNode {
  type: 'IfStatement';
  condition: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode | null;
}

export interface WhileStatementNode extends ASTNode {
  type: 'WhileStatement';
  condition: ASTNode;
  body: ASTNode;
}

export interface ForStatementNode extends ASTNode {
  type: 'ForStatement';
  variable: IdentifierNode;
  iterable: ASTNode;
  body: ASTNode;
}

export interface ReturnStatementNode extends ASTNode {
  type: 'ReturnStatement';
  argument: ASTNode | null;
}

export interface BreakStatementNode extends ASTNode {
  type: 'BreakStatement';
}

export interface ContinueStatementNode extends ASTNode {
  type: 'ContinueStatement';
}

export interface MemberExpressionNode extends ASTNode {
  type: 'MemberExpression';
  object: ASTNode;
  property: IdentifierNode;
}

export interface AssignmentExpressionNode extends ASTNode {
  type: 'AssignmentExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface BlockExpressionNode extends ASTNode {
  type: 'BlockExpression';
  body: ASTNode[];
}

export interface ExpressionStatementNode extends ASTNode {
  type: 'ExpressionStatement';
  expression: ASTNode;
}

export interface ParseError {
  message: string;
  range: Range;
}

export interface ParseResult {
  ast: ProgramNode;
  errors: ParseError[];
  tokens: Token[];
}
