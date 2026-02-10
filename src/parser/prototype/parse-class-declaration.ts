/**
 * Parse class declaration
 *
 * Handles:
 * - Basic classes: class User { }
 * - Inheritance: class Admin extends User { }
 * - Generic classes: class Box<T> { }
 * - Abstract classes: abstract class Shape { }
 * - Properties: public name: string;
 * - Methods: greet(): string { }
 * - Constructors: constructor(name: string) { }
 * - Static members: static count = 0;
 * - Getters/setters: get name() { }, set name(v) { }
 * - Access modifiers: public, private, protected
 */

import type {
  IBlockStatementNode,
  IClassBodyNode,
  IClassDeclarationNode,
  IConstructorDefinitionNode,
  IDecoratorNode,
  IIdentifierNode,
  IMethodDefinitionNode,
  IPropertyDefinitionNode,
  ITypeAnnotationNode,
} from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse class declaration
 *
 * Syntax:
 *   [abstract] class Name [<T>] [extends SuperClass] { ... }
 */
export function _parseClassDeclaration(this: IParserInternal): IClassDeclarationNode {
  const startToken = this._getCurrentToken()!;

  // Parse decorators BEFORE class keyword
  const decorators: IDecoratorNode[] = [];
  while (this._check('AT')) {
    const decorator = this._parseDecorator();
    if (decorator) {
      decorators.push(decorator);
    }
  }

  // Check for 'abstract' modifier
  const isAbstract = this._check('ABSTRACT') ? true : false;
  if (isAbstract) {
    this._advance(); // consume 'abstract'
  }

  // Consume 'class' keyword
  this._expect('CLASS', "Expected 'class' keyword");

  // Parse class name
  const nameToken = this._expect('IDENTIFIER', 'Expected class name');
  const className: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken!.value,
    location: {
      start: {
        line: nameToken!.line,
        column: nameToken!.column,
        offset: nameToken!.start,
      },
      end: {
        line: nameToken!.line,
        column: nameToken!.column + nameToken!.value.length,
        offset: nameToken!.end,
      },
    },
  };

  // Parse optional type parameters: <T, U>
  let typeParameters: string | null = null;
  if (this._check('LT')) {
    // Enter type context for proper angle bracket handling
    this._lexer.enterTypeContext();

    const typeParamTokens: string[] = [];
    this._advance(); // consume <
    let angleDepth = 1;

    while (!this._isAtEnd() && angleDepth > 0) {
      const token = this._getCurrentToken();
      if (!token) break;

      typeParamTokens.push(token.value);

      if (token.type === 'LT') angleDepth++;
      else if (token.type === 'GT') {
        angleDepth--;
        if (angleDepth === 0) {
          this._advance(); // consume final >
          this._lexer.exitTypeContext(); // Exit type context
          break;
        }
      }

      this._advance();
    }

    typeParameters = typeParamTokens.join('');
  }

  // Parse optional extends clause
  let superClass: IIdentifierNode | null = null;
  if (this._check('EXTENDS')) {
    this._advance(); // consume 'extends'
    const superToken = this._expect('IDENTIFIER', 'Expected superclass name');
    superClass = {
      type: ASTNodeType.IDENTIFIER,
      name: superToken!.value,
      location: {
        start: {
          line: superToken!.line,
          column: superToken!.column,
          offset: superToken!.start,
        },
        end: {
          line: superToken!.line,
          column: superToken!.column + superToken!.value.length,
          offset: superToken!.end,
        },
      },
    };

    // Skip generic type arguments if present: extends Array<string>
    if (this._check('LT')) {
      this._lexer.enterTypeContext();

      this._advance(); // consume <
      let angleDepth = 1;

      while (!this._isAtEnd() && angleDepth > 0) {
        const token = this._getCurrentToken();
        if (!token) break;

        if (token.type === 'LT') {
          angleDepth++;
        } else if (token.type === 'GT') {
          angleDepth--;
          if (angleDepth === 0) {
            this._advance(); // consume final >
            this._lexer.exitTypeContext();
            break;
          }
        } else if (token.type === 'JSX_TEXT') {
          // Skip JSX_TEXT tokens that might be generated for generic content
        }

        this._advance();
      }
    }
  }

  // Parse class body
  const body = _parseClassBody.call(this);

  const endToken = this._peek(-1) || this._getCurrentToken()!;

  return {
    type: ASTNodeType.CLASS_DECLARATION,
    name: className,
    superClass,
    typeParameters,
    body,
    abstract: isAbstract,
    decorators: decorators.length > 0 ? decorators : undefined,
    location: {
      start: {
        line: startToken!.line,
        column: startToken!.column,
        offset: startToken!.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column + endToken!.value.length,
        offset: endToken!.end,
      },
    },
  };
}

/**
 * Parse class body
 *
 * Syntax: { members... }
 */
function _parseClassBody(this: IParserInternal): IClassBodyNode {
  const startToken = this._getCurrentToken()!;

  this._expect('LBRACE', "Expected '{' to start class body");

  const members: Array<
    IPropertyDefinitionNode | IMethodDefinitionNode | IConstructorDefinitionNode
  > = [];

  while (!this._check('RBRACE') && !this._isAtEnd()) {
    const member = _parseClassMember.call(this);
    if (member) {
      members.push(member);
    }
  }

  const endToken = this._expect('RBRACE', "Expected '}' to close class body");

  return {
    type: ASTNodeType.CLASS_BODY,
    members,
    location: {
      start: {
        line: startToken!.line,
        column: startToken!.column,
        offset: startToken!.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column + 1,
        offset: endToken!.end,
      },
    },
  };
}

/**
 * Parse class member (property, method, or constructor)
 */
function _parseClassMember(
  this: IParserInternal
): IPropertyDefinitionNode | IMethodDefinitionNode | IConstructorDefinitionNode | null {
  // Skip semicolons
  if (this._check('SEMICOLON')) {
    this._advance();
    return null;
  }

  const startToken = this._getCurrentToken();
  const startLocation = {
    line: startToken!.line,
    column: startToken!.column,
    offset: startToken!.start,
  };

  // Parse decorators (if present)
  const decorators: IDecoratorNode[] = [];
  while (this._check('AT')) {
    const decorator = this._parseDecorator();
    if (decorator) {
      decorators.push(decorator);
    }
  }

  // Parse access modifier
  let accessModifier: 'public' | 'private' | 'protected' | null = null;
  if (this._check('PUBLIC')) {
    accessModifier = 'public';
    this._advance();
  } else if (this._check('PRIVATE')) {
    accessModifier = 'private';
    this._advance();
  } else if (this._check('PROTECTED')) {
    accessModifier = 'protected';
    this._advance();
  }

  // Parse modifiers
  const isStatic = this._check('STATIC') ? true : false;
  if (isStatic) {
    this._advance();
  }

  const isReadonly = this._check('READONLY');
  if (isReadonly) {
    this._advance();
  }

  const isAbstract = this._check('ABSTRACT') ? true : false;
  if (isAbstract) {
    this._advance();
  }

  const isAsync = this._check('ASYNC') ? true : false;
  if (isAsync) {
    this._advance();
  }

  const isGenerator = this._check('ASTERISK') ? true : false;
  if (isGenerator) {
    this._advance();
  }

  // Check for constructor
  if (this._check('CONSTRUCTOR')) {
    return _parseConstructor.call(this, startLocation);
  }

  // Check for getter
  if (this._check('GET')) {
    return _parseGetter.call(this, startLocation, accessModifier, isStatic);
  }

  // Check for setter
  if (this._check('SET')) {
    return _parseSetter.call(this, startLocation, accessModifier, isStatic);
  }

  // Parse member name
  const nameToken = this._expect('IDENTIFIER', 'Expected member name');
  const memberName: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken!.value,
    location: {
      start: {
        line: nameToken!.line,
        column: nameToken!.column,
        offset: nameToken!.start,
      },
      end: {
        line: nameToken!.line,
        column: nameToken!.column + nameToken!.value.length,
        offset: nameToken!.start + nameToken!.value.length,
      },
    },
  };

  // Determine if property or method based on next token
  if (this._check('LPAREN')) {
    // It's a method
    return _parseMethod.call(
      this,
      startLocation,
      memberName,
      accessModifier,
      isStatic,
      isAsync,
      isGenerator,
      isAbstract,
      decorators.length > 0 ? decorators : undefined
    );
  } else {
    // It's a property
    return _parseProperty.call(
      this,
      startLocation,
      memberName,
      accessModifier,
      isStatic,
      isReadonly
    );
  }
}

/**
 * Parse property definition
 *
 * Syntax: [access] [static] [readonly] name: Type [= initializer];
 */
function _parseProperty(
  this: IParserInternal,
  startLocation: any,
  name: IIdentifierNode,
  accessModifier: 'public' | 'private' | 'protected' | null,
  isStatic: boolean,
  isReadonly: boolean
): IPropertyDefinitionNode {
  const startToken = this._getCurrentToken();

  // Parse optional type annotation
  let typeAnnotation: ITypeAnnotationNode | null = null;
  if (this._check('COLON')) {
    this._advance(); // consume ':'
    const typeTokens: string[] = [];

    // Collect type tokens until we hit = or ; or }
    while (
      !this._check('ASSIGN') &&
      !this._check('SEMICOLON') &&
      !this._check('RBRACE') &&
      !this._isAtEnd()
    ) {
      const token = this._getCurrentToken();
      if (!token) break;
      typeTokens.push(token.value);
      this._advance();
    }

    if (typeTokens.length > 0) {
      const typeEndToken = this._getCurrentToken();
      typeAnnotation = {
        type: ASTNodeType.TYPE_ANNOTATION,
        typeString: typeTokens.join(' '),
        location: {
          start: {
            line: startToken!.line,
            column: startToken!.column,
            offset: startToken!.start,
          },
          end: {
            line: typeEndToken!.line,
            column: typeEndToken!.column,
            offset: typeEndToken!.start,
          },
        },
      };
    }
  }

  // Parse optional initializer
  let initializer: any = null;
  if (this._check('ASSIGN')) {
    this._advance(); // consume '='

    // Simple expression parsing - collect tokens until semicolon
    const exprTokens: string[] = [];
    while (!this._check('SEMICOLON') && !this._check('RBRACE') && !this._isAtEnd()) {
      const token = this._getCurrentToken();
      if (!token) break;
      exprTokens.push(token.value);
      this._advance();
    }

    // Build simple literal node
    const exprValue = exprTokens.join(' ');
    initializer = {
      type: 'Literal',
      value: exprValue,
      raw: exprValue,
    };
  }

  // Optional semicolon
  if (this._check('SEMICOLON')) {
    this._advance();
  }

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.PROPERTY_DEFINITION,
    name,
    typeAnnotation,
    initializer,
    static: isStatic,
    readonly: isReadonly,
    accessModifier,
    location: {
      start: startLocation,
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.start,
      },
    },
  };
}

/**
 * Parse method definition
 *
 * Syntax: [access] [static] [async] [*] name(params): ReturnType { body }
 */
function _parseMethod(
  this: IParserInternal,
  startLocation: any,
  name: IIdentifierNode,
  accessModifier: 'public' | 'private' | 'protected' | null,
  isStatic: boolean,
  isAsync: boolean,
  isGenerator: boolean,
  isAbstract: boolean,
  decorators?: IDecoratorNode[]
): IMethodDefinitionNode {
  // Parse parameters
  this._expect('LPAREN', "Expected '(' for method parameters");

  const parameters: any[] = [];
  while (!this._check('RPAREN') && !this._isAtEnd()) {
    const paramToken = this._getCurrentToken();
    if (!paramToken) break;

    // Simple parameter parsing - just collect identifier
    if (paramToken!.type === 'IDENTIFIER') {
      parameters.push({ type: 'Parameter', name: { type: 'Identifier', name: paramToken!.value } });
      this._advance();

      // Skip type annotation if present
      if (this._check('COLON')) {
        this._advance(); // consume :
        // Skip type tokens
        while (!this._check('COMMA') && !this._check('RPAREN') && !this._isAtEnd()) {
          this._advance();
        }
      }

      // Skip comma
      if (this._check('COMMA')) {
        this._advance();
      }
    } else {
      this._advance();
    }
  }

  this._expect('RPAREN', "Expected ')' after method parameters");

  // Parse optional return type
  let returnType: ITypeAnnotationNode | null = null;
  if (this._check('COLON')) {
    this._advance(); // consume ':'
    const typeTokens: string[] = [];
    const typeStartToken = this._getCurrentToken();

    // Collect return type tokens until we hit { or ;
    while (!this._check('LBRACE') && !this._check('SEMICOLON') && !this._isAtEnd()) {
      const token = this._getCurrentToken();
      if (!token) break;
      typeTokens.push(token.value);
      this._advance();
    }

    if (typeTokens.length > 0) {
      const typeEndToken = this._getCurrentToken();
      returnType = {
        type: ASTNodeType.TYPE_ANNOTATION,
        typeString: typeTokens
          .join(' ')
          .replace(/\s*:\s*/g, ': ')
          .replace(/\s*;\s*/g, '; ')
          .replace(/\s*=>\s*/g, ' => '),
        location: {
          start: {
            line: typeStartToken!.line,
            column: typeStartToken!.column,
            offset: typeStartToken!.start,
          },
          end: {
            line: typeEndToken!.line,
            column: typeEndToken!.column,
            offset: typeEndToken!.start,
          },
        },
      };
    }
  }

  // Parse body (or semicolon for abstract methods)
  let body: IBlockStatementNode;
  if (isAbstract && this._check('SEMICOLON')) {
    const semiToken = this._getCurrentToken();
    this._advance(); // consume ';'
    body = {
      type: ASTNodeType.BLOCK_STATEMENT,
      body: [],
      location: {
        start: {
          line: semiToken!.line,
          column: semiToken!.column,
          offset: semiToken!.start,
        },
        end: {
          line: semiToken!.line,
          column: semiToken!.column,
          offset: semiToken!.start,
        },
      },
    };
  } else {
    // Parse block statement inline
    this._expect('LBRACE', 'Expected { for method body');
    const bodyStartToken = this._getCurrentToken();
    const bodyStatements: any[] = [];

    while (!this._check('RBRACE') && !this._isAtEnd()) {
      // Skip statement parsing for now - just skip tokens
      this._advance();
    }

    const bodyEndToken = this._getCurrentToken();
    this._expect('RBRACE', 'Expected } after method body');

    body = {
      type: ASTNodeType.BLOCK_STATEMENT,
      body: bodyStatements,
      location: {
        start: {
          line: bodyStartToken!.line,
          column: bodyStartToken!.column,
          offset: bodyStartToken!.start,
        },
        end: {
          line: bodyEndToken!.line,
          column: bodyEndToken!.column,
          offset: bodyEndToken!.start,
        },
      },
    };
  }

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.METHOD_DEFINITION,
    name,
    kind: 'method',
    parameters,
    returnType,
    body,
    static: isStatic,
    async: isAsync,
    generator: isGenerator,
    abstract: isAbstract,
    accessModifier,
    decorators,
    location: {
      start: startLocation,
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.start,
      },
    },
  };
}

/**
 * Parse getter method
 *
 * Syntax: [access] [static] get name(): Type { body }
 */
function _parseGetter(
  this: IParserInternal,
  startLocation: any,
  accessModifier: 'public' | 'private' | 'protected' | null,
  isStatic: boolean
): IMethodDefinitionNode {
  this._advance(); // consume 'get'

  const nameToken = this._expect('IDENTIFIER', 'Expected getter name');
  const name: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken!.value,
    location: {
      start: {
        line: nameToken!.line,
        column: nameToken!.column,
        offset: nameToken!.start,
      },
      end: {
        line: nameToken!.line,
        column: nameToken!.column + nameToken!.value.length,
        offset: nameToken!.start + nameToken!.value.length,
      },
    },
  };

  this._expect('LPAREN', "Expected '(' for getter");
  this._expect('RPAREN', "Expected ')' for getter (getters have no parameters)");

  // Parse optional return type
  let returnType: ITypeAnnotationNode | null = null;
  if (this._check('COLON')) {
    this._advance(); // consume ':'
    const typeTokens: string[] = [];

    while (!this._check('LBRACE') && !this._isAtEnd()) {
      const token = this._getCurrentToken();
      if (token) {
        typeTokens.push(token.value);
      }
      this._advance();
    }

    if (typeTokens.length > 0) {
      const typeEndToken = this._getCurrentToken();
      returnType = {
        type: ASTNodeType.TYPE_ANNOTATION,
        typeString: typeTokens
          .join(' ')
          .replace(/\s*:\s*/g, ': ')
          .replace(/\s*;\s*/g, '; ')
          .replace(/\s*=>\s*/g, ' => '),
        location: {
          start: startLocation,
          end: {
            line: typeEndToken!.line,
            column: typeEndToken!.column,
            offset: typeEndToken!.start,
          },
        },
      };
    }
  }

  // Parse block statement inline
  this._expect('LBRACE', 'Expected { for getter body');
  const bodyStartToken = this._getCurrentToken();
  const bodyStatements: any[] = [];

  while (!this._check('RBRACE') && !this._isAtEnd()) {
    this._advance();
  }

  const bodyEndToken = this._getCurrentToken();
  this._expect('RBRACE', 'Expected } after getter body');

  const body: IBlockStatementNode = {
    type: ASTNodeType.BLOCK_STATEMENT,
    body: bodyStatements,
    location: {
      start: {
        line: bodyStartToken!.line,
        column: bodyStartToken!.column,
        offset: bodyStartToken!.start,
      },
      end: {
        line: bodyEndToken!.line,
        column: bodyEndToken!.column,
        offset: bodyEndToken!.start,
      },
    },
  };

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.METHOD_DEFINITION,
    name,
    kind: 'get',
    parameters: [],
    returnType,
    body,
    static: isStatic,
    async: false,
    generator: false,
    abstract: false,
    accessModifier,
    location: {
      start: startLocation,
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.start,
      },
    },
  };
}

/**
 * Parse setter method
 *
 * Syntax: [access] [static] set name(value: Type) { body }
 */
function _parseSetter(
  this: IParserInternal,
  startLocation: any,
  accessModifier: 'public' | 'private' | 'protected' | null,
  isStatic: boolean
): IMethodDefinitionNode {
  this._advance(); // consume 'set'

  const nameToken = this._expect('IDENTIFIER', 'Expected setter name');
  const name: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken!.value,
    location: {
      start: {
        line: nameToken!.line,
        column: nameToken!.column,
        offset: nameToken!.start,
      },
      end: {
        line: nameToken!.line,
        column: nameToken!.column + nameToken!.value.length,
        offset: nameToken!.start + nameToken!.value.length,
      },
    },
  };

  this._expect('LPAREN', "Expected '(' for setter");

  const parameters: any[] = [];
  if (!this._check('RPAREN')) {
    const paramToken = this._getCurrentToken();
    if (paramToken && paramToken!.type === 'IDENTIFIER') {
      parameters.push({ type: 'Parameter', name: { type: 'Identifier', name: paramToken!.value } });
      this._advance();

      // Skip type annotation if present
      if (this._check('COLON')) {
        this._advance(); // consume :
        while (!this._check('RPAREN') && !this._isAtEnd()) {
          this._advance();
        }
      }
    }
  }

  this._expect('RPAREN', "Expected ')' after setter parameter");

  // Parse block statement inline
  this._expect('LBRACE', 'Expected { for setter body');
  const bodyStartToken = this._getCurrentToken();
  const bodyStatements: any[] = [];

  while (!this._check('RBRACE') && !this._isAtEnd()) {
    this._advance();
  }

  const bodyEndToken = this._getCurrentToken();
  this._expect('RBRACE', 'Expected } after setter body');

  const body: IBlockStatementNode = {
    type: ASTNodeType.BLOCK_STATEMENT,
    body: bodyStatements,
    location: {
      start: {
        line: bodyStartToken!.line,
        column: bodyStartToken!.column,
        offset: bodyStartToken!.start,
      },
      end: {
        line: bodyEndToken!.line,
        column: bodyEndToken!.column,
        offset: bodyEndToken!.start,
      },
    },
  };

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.METHOD_DEFINITION,
    name,
    kind: 'set',
    parameters,
    returnType: null,
    body,
    static: isStatic,
    async: false,
    generator: false,
    abstract: false,
    accessModifier,
    location: {
      start: startLocation,
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.start,
      },
    },
  };
}

/**
 * Parse constructor
 *
 * Syntax: constructor(params) { body }
 */
function _parseConstructor(this: IParserInternal, startLocation: any): IConstructorDefinitionNode {
  this._advance(); // consume 'constructor'

  this._expect('LPAREN', "Expected '(' for constructor parameters");

  const parameters: any[] = [];
  while (!this._check('RPAREN') && !this._isAtEnd()) {
    const paramToken = this._getCurrentToken();
    if (!paramToken) break;

    if (paramToken!.type === 'IDENTIFIER') {
      parameters.push({ type: 'Parameter', name: { type: 'Identifier', name: paramToken!.value } });
      this._advance();

      // Skip type annotation if present
      if (this._check('COLON')) {
        this._advance(); // consume :
        while (!this._check('COMMA') && !this._check('RPAREN') && !this._isAtEnd()) {
          this._advance();
        }
      }

      // Skip comma
      if (this._check('COMMA')) {
        this._advance();
      }
    } else {
      this._advance();
    }
  }

  this._expect('RPAREN', "Expected ')' after constructor parameters");

  // Parse block statement inline
  this._expect('LBRACE', 'Expected { for constructor body');
  const bodyStartToken = this._getCurrentToken();
  const bodyStatements: any[] = [];

  // Collect statements (basic token-based approach)
  while (!this._check('RBRACE') && !this._isAtEnd()) {
    const stmtStartToken = this._getCurrentToken();
    const stmtTokens: string[] = [];

    // Collect tokens until semicolon or RBRACE
    while (!this._check('SEMICOLON') && !this._check('RBRACE') && !this._isAtEnd()) {
      const token = this._getCurrentToken();
      if (token) stmtTokens.push(token.value);
      this._advance();
    }

    if (this._check('SEMICOLON')) {
      this._advance();
    }

    // Create placeholder statement if we collected tokens
    if (stmtTokens.length > 0) {
      bodyStatements.push({
        type: 'ExpressionStatement',
        expression: {
          type: 'Expression',
          raw: stmtTokens.join(' '),
        },
      });
    }
  }

  const bodyEndToken = this._getCurrentToken();
  this._expect('RBRACE', 'Expected } after constructor body');

  const body: IBlockStatementNode = {
    type: ASTNodeType.BLOCK_STATEMENT,
    body: bodyStatements,
    location: {
      start: {
        line: bodyStartToken!.line,
        column: bodyStartToken!.column,
        offset: bodyStartToken!.start,
      },
      end: {
        line: bodyEndToken!.line,
        column: bodyEndToken!.column,
        offset: bodyEndToken!.start,
      },
    },
  };

  const endToken = this._getCurrentToken();

  return {
    type: ASTNodeType.CONSTRUCTOR_DEFINITION,
    parameters,
    body,
    location: {
      start: startLocation,
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.start,
      },
    },
  };
}
