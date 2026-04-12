import { tokenize, Token } from './lexer';

function tokTypes(source: string): string[] {
  return tokenize(source)
    .filter(t => t.type !== 'Newline' && t.type !== 'EOF')
    .map(t => `${t.type}:${t.value}`);
}

describe('Lexer', () => {
  it('tokenizes keywords', () => {
    const result = tokTypes('let fun if else while for return');
    expect(result).toEqual([
      'Keyword:let', 'Keyword:fun', 'Keyword:if', 'Keyword:else',
      'Keyword:while', 'Keyword:for', 'Keyword:return',
    ]);
  });

  it('tokenizes identifiers', () => {
    expect(tokTypes('foo bar _baz x1')).toEqual([
      'Identifier:foo', 'Identifier:bar', 'Identifier:_baz', 'Identifier:x1',
    ]);
  });

  it('tokenizes string literals with escapes', () => {
    const result = tokTypes('"hello" "world\\n"');
    expect(result).toEqual(['String:"hello"', 'String:"world\\n"']);
  });

  it('tokenizes raw strings', () => {
    expect(tokTypes('@"raw string"')).toEqual(['String:@"raw string"']);
  });

  it('tokenizes decimal numbers', () => {
    expect(tokTypes('42 3.14 1_000')).toEqual([
      'Number:42', 'Number:3.14', 'Number:1_000',
    ]);
  });

  it('tokenizes hex and binary numbers', () => {
    expect(tokTypes('0xFF 0b1010')).toEqual(['Number:0xFF', 'Number:0b1010']);
  });

  it('tokenizes colour codes', () => {
    expect(tokTypes('#FFF #FF00FF #FF00FF80')).toEqual([
      'Number:#FFF', 'Number:#FF00FF', 'Number:#FF00FF80',
    ]);
  });

  it('tokenizes character literals', () => {
    expect(tokTypes("'a' '\\n'")).toEqual(["String:'a'", "String:'\\n'"]);
  });

  it('tokenizes comments', () => {
    const tokens = tokenize('-- this is a comment\nx');
    const nonEof = tokens.filter(t => t.type !== 'EOF' && t.type !== 'Newline');
    expect(nonEof[0].type).toBe('Comment');
    expect(nonEof[0].value).toBe('-- this is a comment');
    expect(nonEof[1].type).toBe('Identifier');
  });

  it('tokenizes operators', () => {
    expect(tokTypes('+ - * / // %')).toEqual([
      'Operator:+', 'Operator:-', 'Operator:*', 'Operator:/',
      'Operator://', 'Operator:%',
    ]);
  });

  it('tokenizes two-char operators', () => {
    expect(tokTypes('<= >= == != <| |>')).toEqual([
      'Operator:<=', 'Operator:>=', 'Operator:==', 'Operator:!=',
      'Operator:<|', 'Operator:|>',
    ]);
  });

  it('tokenizes assignment operators', () => {
    expect(tokTypes('+= -= *= /=')).toEqual([
      'Operator:+=', 'Operator:-=', 'Operator:*=', 'Operator:/=',
    ]);
  });

  it('tokenizes punctuation', () => {
    expect(tokTypes('( ) [ ] { } , ; .')).toEqual([
      'Punctuation:(', 'Punctuation:)', 'Punctuation:[', 'Punctuation:]',
      'Punctuation:{', 'Punctuation:}', 'Punctuation:,', 'Punctuation:;',
      'Punctuation:.',
    ]);
  });

  it('tokenizes backtick identifiers', () => {
    expect(tokTypes('`raw ident`')).toEqual(['Identifier:`raw ident`']);
  });

  it('tracks line and column positions', () => {
    const tokens = tokenize('let x\ny');
    const letTok = tokens[0];
    expect(letTok.range.start).toEqual({ line: 0, character: 0 });
    expect(letTok.range.end).toEqual({ line: 0, character: 3 });
    const yTok = tokens.find(t => t.value === 'y')!;
    expect(yTok.range.start).toEqual({ line: 1, character: 0 });
  });

  it('always ends with EOF', () => {
    const tokens = tokenize('');
    expect(tokens.length).toBe(1);
    expect(tokens[0].type).toBe('EOF');
  });
});
