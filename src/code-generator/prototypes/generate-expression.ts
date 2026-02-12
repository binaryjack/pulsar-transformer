/**
 * CodeGenerator.prototype.generateExpression
 * Generate expression code
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.generateExpression = function (this: ICodeGenerator, node: any): string {
  if (!node) return '';

  switch (node.type) {
    case 'Identifier':
      return node.name;

    case 'Literal':
      if (typeof node.value === 'string') {
        return `'${node.value}'`;
      }
      return String(node.value);

    case 'TemplateLiteral':
      return this.generateTemplateLiteral(node);

    case 'CallExpression':
      return this.generateCallExpression(node);

    case 'MemberExpression':
      const object = this.generateExpression(node.object);
      const property = node.computed
        ? `[${this.generateExpression(node.property)}]`
        : node.optional
          ? `?.${node.property.name}`
          : `.${node.property.name}`;
      return `${object}${property}`;

    case 'BinaryExpression':
      return `${this.generateExpression(node.left)} ${node.operator} ${this.generateExpression(node.right)}`;

    case 'LogicalExpression':
      return `${this.generateExpression(node.left)} ${node.operator} ${this.generateExpression(node.right)}`;

    case 'UnaryExpression':
      return `${node.operator}${this.generateExpression(node.argument)}`;

    case 'ConditionalExpression':
      return `${this.generateExpression(node.test)} ? ${this.generateExpression(node.consequent)} : ${this.generateExpression(node.alternate)}`;

    case 'ArrowFunctionExpression':
      return this.generateArrowFunction(node);

    case 'ArrayExpression':
      const elements = node.elements.map((e: any) => this.generateExpression(e)).join(', ');
      return `[${elements}]`;

    case 'ObjectExpression':
      return this.generateObjectExpression(node);

    case 'JSXElement':
      return this.generateJSXElement(node);

    default:
      return `/* Unhandled expression: ${node.type} */`;
  }
};

/**
 * Generate call expression
 */
CodeGenerator.prototype.generateCallExpression = function (
  this: ICodeGenerator,
  node: any
): string {
  const callee = this.generateExpression(node.callee);
  const args = node.arguments.map((arg: any) => this.generateExpression(arg)).join(', ');
  return `${callee}(${args})`;
};

/**
 * Generate arrow function
 */
CodeGenerator.prototype.generateArrowFunction = function (this: ICodeGenerator, node: any): string {
  // Generate parameter list
  const params = node.params
    .map((p: any) => {
      if (p.pattern.type === 'ObjectPattern') {
        // Object destructuring: {label, variant = 'primary', icon}
        const props = p.pattern.properties
          .map((prop: any) => {
            const key = prop.key.name;
            if (prop.defaultValue) {
              const defaultVal = this.generateExpression(prop.defaultValue);
              return `${key} = ${defaultVal}`;
            }
            return key;
          })
          .join(', ');

        // JavaScript output - no type annotations
        return `{${props}}`;
      } else {
        // Simple identifier - JavaScript output, no type annotations
        return p.pattern.name;
      }
    })
    .join(', ');

  // JavaScript output - no return type annotations

  if (node.body.type === 'BlockStatement') {
    // For arrow functions with block body, manually handle braces
    // to avoid indentation issues with generateBlockStatement
    const statements: string[] = [];
    this.indentLevel++;
    for (const stmt of node.body.body) {
      statements.push(this.generateStatement(stmt));
    }
    this.indentLevel--;

    const body = statements.length > 0 ? `{\n${statements.join('\n')}\n${this.indent()}}` : '{}';

    return `(${params}) => ${body}`;
  } else {
    return `(${params}) => ${this.generateExpression(node.body)}`;
  }
};

/**
 * Generate object expression
 */
CodeGenerator.prototype.generateObjectExpression = function (
  this: ICodeGenerator,
  node: any
): string {
  if (node.properties.length === 0) {
    return '{}';
  }

  const props = node.properties
    .map((prop: any) => {
      if (prop.shorthand) {
        return prop.key.name;
      }
      return `${prop.key.name}: ${this.generateExpression(prop.value)}`;
    })
    .join(', ');

  return `{ ${props} }`;
};

/**
 * Generate template literal
 * Transforms template literal to string concatenation
 * Example: `hello ${name}!` → 'hello ' + name + '!'
 */
CodeGenerator.prototype.generateTemplateLiteral = function (
  this: ICodeGenerator,
  node: any
): string {
  const { quasis, expressions } = node;

  // Simple template literal without expressions
  if (expressions.length === 0) {
    return `'${quasis[0].value.cooked}'`;
  }

  // Template with expressions - build concatenation chain
  const parts: string[] = [];

  for (let i = 0; i < quasis.length; i++) {
    const quasi = quasis[i];

    // Add string part if not empty
    if (quasi.value.cooked !== '') {
      parts.push(`'${quasi.value.cooked}'`);
    }

    // Add expression if not the last quasi
    if (i < expressions.length) {
      parts.push(this.generateExpression(expressions[i]));
    }
  }

  // Join with + operator
  return parts.join(' + ');
};
