import { parse } from './parser';
import {
  ProgramNode,
  LetDeclarationNode,
  FunctionExpressionNode,
  CallExpressionNode,
  BinaryExpressionNode,
  IdentifierNode,
  LiteralNode,
  IfStatementNode,
  WhileStatementNode,
  ReturnStatementNode,
  MemberExpressionNode,
  ExpressionStatementNode,
  BlockExpressionNode,
  ForStatementNode,
  BreakStatementNode,
  ContinueStatementNode,
} from './ast';

describe('Parser', () => {
  describe('let declarations', () => {
    it('parses let with value', () => {
      const { ast, errors } = parse('let x = 42');
      expect(errors).toHaveLength(0);
      expect(ast.body).toHaveLength(1);
      const decl = ast.body[0] as LetDeclarationNode;
      expect(decl.type).toBe('LetDeclaration');
      expect(decl.name.name).toBe('x');
      expect((decl.value as LiteralNode).value).toBe('42');
    });

    it('parses let without value', () => {
      const { ast, errors } = parse('let y');
      expect(errors).toHaveLength(0);
      const decl = ast.body[0] as LetDeclarationNode;
      expect(decl.type).toBe('LetDeclaration');
      expect(decl.name.name).toBe('y');
      expect(decl.value).toBeNull();
    });
  });

  describe('function expressions', () => {
    it('parses fun with params and block body', () => {
      const { ast, errors } = parse('let add = fun(a, b) { a + b }');
      expect(errors).toHaveLength(0);
      const decl = ast.body[0] as LetDeclarationNode;
      const fn = decl.value as FunctionExpressionNode;
      expect(fn.type).toBe('FunctionExpression');
      expect(fn.params).toHaveLength(2);
      expect(fn.params[0].name).toBe('a');
      expect(fn.params[1].name).toBe('b');
    });

    it('parses fun with no params', () => {
      const { ast, errors } = parse('fun() { 1 }');
      expect(errors).toHaveLength(0);
      const stmt = ast.body[0] as ExpressionStatementNode;
      const fn = stmt.expression as FunctionExpressionNode;
      expect(fn.params).toHaveLength(0);
    });
  });

  describe('expressions', () => {
    it('parses binary expressions with precedence', () => {
      const { ast, errors } = parse('1 + 2 * 3');
      expect(errors).toHaveLength(0);
      const stmt = ast.body[0] as ExpressionStatementNode;
      const bin = stmt.expression as BinaryExpressionNode;
      expect(bin.operator).toBe('+');
      expect((bin.left as LiteralNode).value).toBe('1');
      const right = bin.right as BinaryExpressionNode;
      expect(right.operator).toBe('*');
    });

    it('parses call expressions', () => {
      const { ast, errors } = parse('foo(1, 2)');
      expect(errors).toHaveLength(0);
      const stmt = ast.body[0] as ExpressionStatementNode;
      const call = stmt.expression as CallExpressionNode;
      expect(call.type).toBe('CallExpression');
      expect((call.callee as IdentifierNode).name).toBe('foo');
      expect(call.args).toHaveLength(2);
    });

    it('parses member access', () => {
      const { ast, errors } = parse('obj.prop');
      expect(errors).toHaveLength(0);
      const stmt = ast.body[0] as ExpressionStatementNode;
      const member = stmt.expression as MemberExpressionNode;
      expect(member.type).toBe('MemberExpression');
      expect((member.object as IdentifierNode).name).toBe('obj');
      expect(member.property.name).toBe('prop');
    });

    it('parses chained member access and calls', () => {
      const { ast, errors } = parse('a.b.c(1)');
      expect(errors).toHaveLength(0);
      const stmt = ast.body[0] as ExpressionStatementNode;
      const call = stmt.expression as CallExpressionNode;
      expect(call.type).toBe('CallExpression');
      const callee = call.callee as MemberExpressionNode;
      expect(callee.property.name).toBe('c');
    });

    it('parses assignment', () => {
      const { ast, errors } = parse('x = 10');
      expect(errors).toHaveLength(0);
      const stmt = ast.body[0] as ExpressionStatementNode;
      expect(stmt.expression.type).toBe('AssignmentExpression');
    });

    it('parses logical operators', () => {
      const { ast, errors } = parse('a and b or c');
      expect(errors).toHaveLength(0);
      const stmt = ast.body[0] as ExpressionStatementNode;
      const or = stmt.expression as BinaryExpressionNode;
      expect(or.operator).toBe('or');
      expect((or.left as BinaryExpressionNode).operator).toBe('and');
    });
  });

  describe('control flow', () => {
    it('parses if statement', () => {
      const { ast, errors } = parse('if x { y }');
      expect(errors).toHaveLength(0);
      const ifStmt = ast.body[0] as IfStatementNode;
      expect(ifStmt.type).toBe('IfStatement');
      expect((ifStmt.condition as IdentifierNode).name).toBe('x');
      expect(ifStmt.alternate).toBeNull();
    });

    it('parses if-else', () => {
      const { ast, errors } = parse('if x { 1 } else { 2 }');
      expect(errors).toHaveLength(0);
      const ifStmt = ast.body[0] as IfStatementNode;
      expect(ifStmt.alternate).not.toBeNull();
    });

    it('parses while statement', () => {
      const { ast, errors } = parse('while x { y }');
      expect(errors).toHaveLength(0);
      const whileStmt = ast.body[0] as WhileStatementNode;
      expect(whileStmt.type).toBe('WhileStatement');
    });

    it('parses for statement', () => {
      const { ast, errors } = parse('for i in items { i }');
      expect(errors).toHaveLength(0);
      const forStmt = ast.body[0] as ForStatementNode;
      expect(forStmt.type).toBe('ForStatement');
      expect(forStmt.variable.name).toBe('i');
    });

    it('parses return statement', () => {
      const { ast, errors } = parse('return 42');
      expect(errors).toHaveLength(0);
      const ret = ast.body[0] as ReturnStatementNode;
      expect(ret.type).toBe('ReturnStatement');
      expect((ret.argument as LiteralNode).value).toBe('42');
    });

    it('parses break and continue', () => {
      const { ast, errors } = parse('break\ncontinue');
      expect(errors).toHaveLength(0);
      expect(ast.body[0].type).toBe('BreakStatement');
      expect(ast.body[1].type).toBe('ContinueStatement');
    });
  });

  describe('error recovery', () => {
    it('recovers from errors and produces partial AST', () => {
      const { ast, errors } = parse('let x = \nlet y = 5');
      // Should have some errors but still parse the second declaration
      expect(ast.body.length).toBeGreaterThanOrEqual(1);
    });

    it('reports error for unexpected tokens', () => {
      const { errors } = parse(') + (');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('returns tokens in result', () => {
      const { tokens } = parse('let x = 1');
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[tokens.length - 1].type).toBe('EOF');
    });
  });

  describe('literals', () => {
    it('parses boolean literals', () => {
      const { ast, errors } = parse('true');
      expect(errors).toHaveLength(0);
      const stmt = ast.body[0] as ExpressionStatementNode;
      const lit = stmt.expression as LiteralNode;
      expect(lit.literalType).toBe('boolean');
      expect(lit.value).toBe('true');
    });

    it('parses undefined literal', () => {
      const { ast } = parse('undefined');
      const stmt = ast.body[0] as ExpressionStatementNode;
      const lit = stmt.expression as LiteralNode;
      expect(lit.literalType).toBe('undefined');
    });

    it('parses string literal', () => {
      const { ast } = parse('"hello"');
      const stmt = ast.body[0] as ExpressionStatementNode;
      const lit = stmt.expression as LiteralNode;
      expect(lit.literalType).toBe('string');
    });
  });

  describe('multiline programs', () => {
    it('parses multiple statements', () => {
      const source = `let x = 1
let y = 2
x + y`;
      const { ast, errors } = parse(source);
      expect(errors).toHaveLength(0);
      expect(ast.body).toHaveLength(3);
    });
  });
});
