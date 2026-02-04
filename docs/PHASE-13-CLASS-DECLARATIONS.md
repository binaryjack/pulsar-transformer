# Phase 13: Class Declarations - Implementation Plan

**Status:** Planning  
**Priority:** P1  
**Estimated Tests:** 30+  
**Dependencies:** Phase 10 (Function Declarations), Phase 11 (Interface/Type Declarations)

---

## 🎯 Objectives

Implement full class declaration parsing, analysis, and emission including:

1. Basic class declarations with constructors
2. Class methods (instance and static)
3. Class properties (with type annotations)
4. Getters and setters
5. Inheritance (`extends`)
6. Access modifiers (public, private, protected)
7. Abstract classes
8. Generic classes
9. Class expressions

---

## 📋 Syntax Coverage

### Basic Class

```typescript
class User {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return `Hello, ${this.name}`;
  }
}
```

### Inheritance

```typescript
class Admin extends User {
  role: string;

  constructor(name: string, age: number, role: string) {
    super(name, age);
    this.role = role;
  }

  override greet(): string {
    return `Admin ${this.name} says hello`;
  }
}
```

### Static Members

```typescript
class MathUtils {
  static PI = 3.14159;

  static square(n: number): number {
    return n * n;
  }
}
```

### Getters/Setters

```typescript
class Temperature {
  private _celsius: number;

  get fahrenheit(): number {
    return (this._celsius * 9) / 5 + 32;
  }

  set fahrenheit(value: number) {
    this._celsius = ((value - 32) * 5) / 9;
  }
}
```

### Generic Class

```typescript
class Box<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }
}
```

### Abstract Class

```typescript
abstract class Shape {
  abstract area(): number;

  describe(): string {
    return `Area: ${this.area()}`;
  }
}
```

### Access Modifiers

```typescript
class BankAccount {
  public accountNumber: string;
  private balance: number;
  protected transactions: Transaction[];

  private validateAmount(amount: number): boolean {
    return amount > 0;
  }
}
```

---

## 🏗️ Implementation Tasks

### Task 1: AST Types

**File:** `src/parser/ast/ast-node-types.ts`

Add node types:

- `CLASS_DECLARATION`
- `CLASS_EXPRESSION`
- `METHOD_DEFINITION`
- `PROPERTY_DEFINITION`
- `CONSTRUCTOR_DEFINITION`

**Interfaces to add:**

```typescript
export interface IClassDeclarationNode extends IBaseASTNode {
  type: ASTNodeType.CLASS_DECLARATION;
  name: string;
  superClass: string | null;
  typeParameters: string | null; // Generic parameters: <T, U>
  body: IClassBodyNode;
  abstract: boolean;
  location: ISourceLocation;
}

export interface IClassBodyNode extends IBaseASTNode {
  type: ASTNodeType.CLASS_BODY;
  members: Array<IPropertyDefinitionNode | IMethodDefinitionNode | IConstructorDefinitionNode>;
  location: ISourceLocation;
}

export interface IPropertyDefinitionNode extends IBaseASTNode {
  type: ASTNodeType.PROPERTY_DEFINITION;
  name: string;
  typeAnnotation: ITypeAnnotationNode | null;
  initializer: IExpressionNode | null;
  static: boolean;
  readonly: boolean;
  accessModifier: 'public' | 'private' | 'protected' | null;
  location: ISourceLocation;
}

export interface IMethodDefinitionNode extends IBaseASTNode {
  type: ASTNodeType.METHOD_DEFINITION;
  name: string;
  kind: 'method' | 'get' | 'set';
  parameters: IParameterNode[];
  returnType: ITypeAnnotationNode | null;
  body: IBlockStatementNode;
  static: boolean;
  async: boolean;
  generator: boolean;
  abstract: boolean;
  accessModifier: 'public' | 'private' | 'protected' | null;
  location: ISourceLocation;
}

export interface IConstructorDefinitionNode extends IBaseASTNode {
  type: ASTNodeType.CONSTRUCTOR_DEFINITION;
  parameters: IParameterNode[];
  body: IBlockStatementNode;
  location: ISourceLocation;
}
```

---

### Task 2: Lexer Updates

**File:** `src/lexer/token-types.ts`

Add tokens:

- `CLASS` = 'CLASS'
- `EXTENDS` = 'EXTENDS'
- `SUPER` = 'SUPER'
- `STATIC` = 'STATIC'
- `GET` = 'GET'
- `SET` = 'SET'
- `ABSTRACT` = 'ABSTRACT'
- `PUBLIC` = 'PUBLIC'
- `PRIVATE` = 'PRIVATE'
- `PROTECTED` = 'PROTECTED'
- `READONLY` = 'READONLY'
- `OVERRIDE` = 'OVERRIDE'
- `CONSTRUCTOR` = 'CONSTRUCTOR'

**File:** `src/lexer/prototype/tokenize.ts`

Update keyword map:

```typescript
const KEYWORDS: Record<string, TokenType> = {
  // ... existing keywords
  class: TokenType.CLASS,
  extends: TokenType.EXTENDS,
  super: TokenType.SUPER,
  static: TokenType.STATIC,
  get: TokenType.GET,
  set: TokenType.SET,
  abstract: TokenType.ABSTRACT,
  public: TokenType.PUBLIC,
  private: TokenType.PRIVATE,
  protected: TokenType.PROTECTED,
  readonly: TokenType.READONLY,
  override: TokenType.OVERRIDE,
  constructor: TokenType.CONSTRUCTOR,
};
```

---

### Task 3: Parser Implementation

**File:** `src/parser/prototype/parse-class-declaration.ts`

Create comprehensive class parser:

```typescript
import type { Parser } from '../parser';
import type {
  IClassDeclarationNode,
  IClassBodyNode,
  IPropertyDefinitionNode,
  IMethodDefinitionNode,
  IConstructorDefinitionNode,
  IParameterNode,
  ISourceLocation,
} from '../ast/ast-node-types';
import { ASTNodeType } from '../ast/ast-node-types';
import type { TokenType } from '../../lexer/token-types';

/**
 * Parse class declaration
 *
 * Syntax:
 *   [abstract] class Name [<T>] [extends SuperClass] {
 *     [access] [static|readonly] property: Type [= initializer];
 *     [access] [static] [async|*] method(params): ReturnType { }
 *     [access] get property(): Type { }
 *     [access] set property(value: Type) { }
 *     constructor(params) { }
 *   }
 *
 * @this {Parser}
 * @returns {IClassDeclarationNode}
 */
export function _parseClassDeclaration(this: Parser): IClassDeclarationNode {
  const startLocation = this._getLocation();

  // Check for 'abstract' modifier
  const isAbstract = this._check('ABSTRACT');
  if (isAbstract) {
    this._advance(); // consume 'abstract'
  }

  // Consume 'class' keyword
  this._consume('CLASS', "Expected 'class' keyword");

  // Parse class name
  const nameToken = this._consume('IDENTIFIER', 'Expected class name');
  const className = nameToken.value;

  // Parse optional type parameters: <T, U>
  let typeParameters: string | null = null;
  if (this._check('LT')) {
    typeParameters = this._parseTypeParameters();
  }

  // Parse optional extends clause
  let superClass: string | null = null;
  if (this._check('EXTENDS')) {
    this._advance(); // consume 'extends'
    const superToken = this._consume('IDENTIFIER', 'Expected superclass name');
    superClass = superToken.value;
  }

  // Parse class body
  const body = this._parseClassBody();

  const endLocation = this._getLocation();

  return {
    type: ASTNodeType.CLASS_DECLARATION,
    name: className,
    superClass,
    typeParameters,
    body,
    abstract: isAbstract,
    location: {
      start: startLocation,
      end: endLocation,
    },
  };
}

/**
 * Parse class body
 *
 * @this {Parser}
 * @returns {IClassBodyNode}
 */
function _parseClassBody(this: Parser): IClassBodyNode {
  const startLocation = this._getLocation();

  this._consume('LBRACE', "Expected '{' to start class body");

  const members: Array<
    IPropertyDefinitionNode | IMethodDefinitionNode | IConstructorDefinitionNode
  > = [];

  while (!this._check('RBRACE') && !this._isAtEnd()) {
    const member = this._parseClassMember();
    if (member) {
      members.push(member);
    }
  }

  this._consume('RBRACE', "Expected '}' to close class body");

  const endLocation = this._getLocation();

  return {
    type: ASTNodeType.CLASS_BODY,
    members,
    location: {
      start: startLocation,
      end: endLocation,
    },
  };
}

/**
 * Parse class member (property, method, or constructor)
 *
 * @this {Parser}
 * @returns {IPropertyDefinitionNode | IMethodDefinitionNode | IConstructorDefinitionNode | null}
 */
function _parseClassMember(
  this: Parser
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
    return this._parseConstructor(startLocation);
  }

  // Check for getter
  if (this._check('GET')) {
    return this._parseGetter(startLocation, accessModifier, isStatic);
  }

  // Check for setter
  if (this._check('SET')) {
    return this._parseSetter(startLocation, accessModifier, isStatic);
  }

  // Parse member name
  const nameToken = this._consume('IDENTIFIER', 'Expected member name');
  const memberName = nameToken.value;

  // Determine if property or method based on next token
  if (this._check('LPAREN')) {
    // It's a method
    return this._parseMethod(
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
    return this._parseProperty(startLocation, memberName, accessModifier, isStatic, isReadonly);
  }
}

// Additional helper methods...
```

---

### Task 4: Test Cases

**File:** `src/parser/__tests__/parse-class-declaration.test.ts`

Comprehensive test suite (30+ tests):

```typescript
describe('Class Declaration Parsing', () => {
  describe('Basic Classes', () => {
    it('should parse empty class', () => {
      const source = 'class Empty {}';
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe(ASTNodeType.CLASS_DECLARATION);
      expect(ast.body[0].name).toBe('Empty');
      expect(ast.body[0].body.members).toHaveLength(0);
    });

    it('should parse class with properties', () => {
      const source = `
        class User {
          name: string;
          age: number;
        }
      `;
      // assertions...
    });

    it('should parse class with constructor', () => {
      const source = `
        class User {
          constructor(name: string) {
            this.name = name;
          }
        }
      `;
      // assertions...
    });

    it('should parse class with methods', () => {
      const source = `
        class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }
        }
      `;
      // assertions...
    });
  });

  describe('Inheritance', () => {
    it('should parse class with extends', () => {
      const source = 'class Admin extends User {}';
      // assertions...
    });

    it('should parse class with super in constructor', () => {
      const source = `
        class Admin extends User {
          constructor(name: string, role: string) {
            super(name);
            this.role = role;
          }
        }
      `;
      // assertions...
    });
  });

  describe('Static Members', () => {
    it('should parse static property', () => {
      const source = `
        class MathUtils {
          static PI = 3.14159;
        }
      `;
      // assertions...
    });

    it('should parse static method', () => {
      const source = `
        class MathUtils {
          static square(n: number): number {
            return n * n;
          }
        }
      `;
      // assertions...
    });
  });

  describe('Getters and Setters', () => {
    it('should parse getter', () => {
      const source = `
        class Temperature {
          get celsius(): number {
            return this._celsius;
          }
        }
      `;
      // assertions...
    });

    it('should parse setter', () => {
      const source = `
        class Temperature {
          set celsius(value: number) {
            this._celsius = value;
          }
        }
      `;
      // assertions...
    });
  });

  describe('Access Modifiers', () => {
    it('should parse public property', () => {
      const source = `
        class User {
          public name: string;
        }
      `;
      // assertions...
    });

    it('should parse private property', () => {
      const source = `
        class BankAccount {
          private balance: number;
        }
      `;
      // assertions...
    });

    it('should parse protected property', () => {
      const source = `
        class Base {
          protected data: string;
        }
      `;
      // assertions...
    });
  });

  describe('Generic Classes', () => {
    it('should parse class with single type parameter', () => {
      const source = `
        class Box<T> {
          private value: T;
        }
      `;
      // assertions...
    });

    it('should parse class with multiple type parameters', () => {
      const source = `
        class Pair<T, U> {
          first: T;
          second: U;
        }
      `;
      // assertions...
    });
  });

  describe('Abstract Classes', () => {
    it('should parse abstract class', () => {
      const source = `
        abstract class Shape {
          abstract area(): number;
        }
      `;
      // assertions...
    });

    it('should parse abstract method', () => {
      const source = `
        abstract class Animal {
          abstract makeSound(): void;
          
          move(): void {
            console.log('Moving...');
          }
        }
      `;
      // assertions...
    });
  });

  describe('Complex Classes', () => {
    it('should parse class with all features', () => {
      const source = `
        abstract class BaseController<T> extends EventEmitter {
          private static instanceCount = 0;
          protected readonly id: string;
          public active: boolean = false;
          
          constructor(id: string) {
            super();
            this.id = id;
            BaseController.instanceCount++;
          }
          
          public static getInstanceCount(): number {
            return this.instanceCount;
          }
          
          public get isActive(): boolean {
            return this.active;
          }
          
          public set isActive(value: boolean) {
            this.active = value;
          }
          
          protected abstract process(data: T): void;
          
          public async execute(data: T): Promise<void> {
            this.process(data);
          }
        }
      `;
      // comprehensive assertions...
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty constructor', () => {
      const source = `
        class User {
          constructor() {}
        }
      `;
      // assertions...
    });

    it('should handle multiple access modifiers correctly', () => {
      const source = `
        class Example {
          public a: string;
          private b: number;
          protected c: boolean;
        }
      `;
      // assertions...
    });

    it('should handle readonly properties', () => {
      const source = `
        class Config {
          readonly apiKey: string = 'abc123';
        }
      `;
      // assertions...
    });
  });

  describe('Location Tracking', () => {
    it('should track class declaration location', () => {
      const source = 'class User {}';
      const ast = parser.parse(source);

      expect(ast.body[0].location).toBeDefined();
      expect(ast.body[0].location.start.line).toBe(1);
    });
  });
});
```

---

## 🎯 Success Criteria

- [ ] All 30+ test cases passing
- [ ] Parser handles all class syntax variations
- [ ] Proper AST node structure for all class members
- [ ] Access modifiers correctly parsed
- [ ] Generic classes supported
- [ ] Abstract classes and methods supported
- [ ] Inheritance (extends) working
- [ ] Static members working
- [ ] Getters/setters working
- [ ] Location tracking accurate
- [ ] No regressions in existing tests

---

## 📊 Estimated Timeline

- **Day 1:** AST types + Lexer tokens (2-3 hours)
- **Day 2:** Basic class parsing + properties (4-5 hours)
- **Day 3:** Methods + constructors (4-5 hours)
- **Day 4:** Advanced features (static, getters/setters) (3-4 hours)
- **Day 5:** Generic + abstract classes (3-4 hours)
- **Day 6:** Tests + refinement (4-5 hours)

**Total:** ~20-26 hours over 6 days

---

## 🔗 Dependencies

**Completed:**

- Phase 10: Function declarations (for method bodies)
- Phase 11: Interface/type declarations (for type annotations)
- Expression parsing (for property initializers)

**Required Files:**

- `token-types.ts` - Token definitions
- `ast-node-types.ts` - AST interfaces
- `tokenize.ts` - Keyword map
- `parser.ts` - Main parser class
- `parse.ts` - Statement routing

---

## 📝 Notes

1. **Constructor parameters** - Can use `public`/`private`/`protected` shorthand:

   ```typescript
   constructor(public name: string, private age: number) {}
   ```

2. **Method overloading** - Not supported in current phase (defer to Phase 14)

3. **Decorators** - Not supported in current phase (defer to Phase 15)

4. **Parameter properties** - Constructor shorthand creates properties automatically

5. **Class expressions** - `const MyClass = class {}` - Lower priority, implement after basic classes

---

## 🚀 Next Steps After Phase 13

**Phase 14:** Method Overloading + Advanced Types  
**Phase 15:** Decorators  
**Phase 16:** Enum Declarations  
**Phase 17:** Namespace Declarations

---

**Ready to implement?** Start with Task 1 (AST Types).
