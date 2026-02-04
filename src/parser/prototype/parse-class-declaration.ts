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

  // Check for 'abstract' modifier
  const isAbstract = this._check('ABSTRACT');
  if (isAbstract) {
    this._advance(); // consume 'abstract'
  }

  // Consume 'class' keyword
  this._expect('CLASS', "Expected 'class' keyword");

  // Parse class name
  const nameToken = this._expect('IDENTIFIER', 'Expected class name');
  const className: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken.value,
    location: {
      start: {
        line: nameToken.line,
        column: nameToken.column,
        offset: nameToken.start,
      },
      end: {
        line: nameToken.line,
        column: nameToken.column + nameToken.value.length,
        offset: nameToken.end,
      },
    },
  };

  // Parse optional type parameters: <T, U>
  let typeParameters: string | null = null;
  if (this._check('LT')) {
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
      name: superToken.value,
      location: {
        start: {
          line: superToken.line,
          column: superToken.column,
          offset: superToken.start,
        },
        end: {
          line: superToken.line,
          column: superToken.column + superToken.value.length,
          offset: superToken.end,
        },
      },
    };
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
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column + endToken.value.length,
        offset: endToken.end,
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
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column + 1,
        offset: endToken.end,
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

  const startLocation = this._getLocation();

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
  const isStatic = this._check('STATIC');
  if (isStatic) {
    this._advance();
  }

  const isReadonly = this._check('READONLY');
  if (isReadonly) {
    this._advance();
  }

  const isAbstract = this._check('ABSTRACT');
  if (isAbstract) {
    this._advance();
  }

  const isAsync = this._check('ASYNC');
  if (isAsync) {
    this._advance();
  }

  const isGenerator = this._check('ASTERISK');
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
  const nameToken = this._consume('IDENTIFIER', 'Expected member name');
  const memberName: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken.value,
    location: {
      start: this._getLocation(),
      end: this._getLocation(),
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
      isAbstract
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
      typeTokens.push(this._current().value);
      this._advance();
    }

    if (typeTokens.length > 0) {
      typeAnnotation = {
        type: ASTNodeType.TYPE_ANNOTATION,
        typeString: typeTokens.join(' '),
        location: {
          start: startLocation,
          end: this._getLocation(),
        },
      };
    }
  }

  // Parse optional initializer
  let initializer: any = null;
  if (this._check('ASSIGN')) {
    this._advance(); // consume '='

    // Parse initializer expression
    initializer = this._parseExpression();
  }

  // Optional semicolon
  if (this._check('SEMICOLON')) {
    this._advance();
  }

  const endLocation = this._getLocation();

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
      end: endLocation,
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
  isAbstract: boolean
): IMethodDefinitionNode {
  // Parse parameters
  this._consume('LPAREN', "Expected '(' for method parameters");
  const parameters = this._parseFunctionParameters();
  this._consume('RPAREN', "Expected ')' after method parameters");

  // Parse optional return type
  let returnType: ITypeAnnotationNode | null = null;
  if (this._check('COLON')) {
    this._advance(); // consume ':'
    const typeTokens: string[] = [];

    // Collect return type tokens until we hit { or ;
    while (!this._check('LBRACE') && !this._check('SEMICOLON') && !this._isAtEnd()) {
      typeTokens.push(this._current().value);
      this._advance();
    }

    if (typeTokens.length > 0) {
      returnType = {
        type: ASTNodeType.TYPE_ANNOTATION,
        typeString: typeTokens.join(' '),
        location: {
          start: startLocation,
          end: this._getLocation(),
        },
      };
    }
  }

  // Parse body (or semicolon for abstract methods)
  let body: IBlockStatementNode;
  if (isAbstract && this._check('SEMICOLON')) {
    this._advance(); // consume ';'
    body = {
      type: ASTNodeType.BLOCK_STATEMENT,
      body: [],
      location: {
        start: this._getLocation(),
        end: this._getLocation(),
      },
    };
  } else {
    body = this._parseBlockStatement();
  }

  const endLocation = this._getLocation();

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
    location: {
      start: startLocation,
      end: endLocation,
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

  const nameToken = this._consume('IDENTIFIER', 'Expected getter name');
  const name: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken.value,
    location: {
      start: this._getLocation(),
      end: this._getLocation(),
    },
  };

  this._consume('LPAREN', "Expected '(' for getter");
  this._consume('RPAREN', "Expected ')' for getter (getters have no parameters)");

  // Parse optional return type
  let returnType: ITypeAnnotationNode | null = null;
  if (this._check('COLON')) {
    this._advance(); // consume ':'
    const typeTokens: string[] = [];

    while (!this._check('LBRACE') && !this._isAtEnd()) {
      typeTokens.push(this._current().value);
      this._advance();
    }

    if (typeTokens.length > 0) {
      returnType = {
        type: ASTNodeType.TYPE_ANNOTATION,
        typeString: typeTokens.join(' '),
        location: {
          start: startLocation,
          end: this._getLocation(),
        },
      };
    }
  }

  const body = this._parseBlockStatement();
  const endLocation = this._getLocation();

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
      end: endLocation,
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

  const nameToken = this._consume('IDENTIFIER', 'Expected setter name');
  const name: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken.value,
    location: {
      start: this._getLocation(),
      end: this._getLocation(),
    },
  };

  this._consume('LPAREN', "Expected '(' for setter");
  const parameters = this._parseFunctionParameters();
  this._consume('RPAREN', "Expected ')' after setter parameter");

  const body = this._parseBlockStatement();
  const endLocation = this._getLocation();

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
      end: endLocation,
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

  this._consume('LPAREN', "Expected '(' for constructor parameters");
  const parameters = this._parseFunctionParameters();
  this._consume('RPAREN', "Expected ')' after constructor parameters");

  const body = this._parseBlockStatement();
  const endLocation = this._getLocation();

  return {
    type: ASTNodeType.CONSTRUCTOR_DEFINITION,
    parameters,
    body,
    location: {
      start: startLocation,
      end: endLocation,
    },
  };
}
