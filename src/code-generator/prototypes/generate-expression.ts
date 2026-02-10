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

    case 'CallExpression':
      return this.generateCallExpression(node);

    case 'MemberExpression':
      const object = this.generateExpression(node.object);
      const property = node.computed
        ? `[${this.generateExpression(node.property)}]`
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

        let result = `{${props}}`;

        // Add type annotation if present
        if (p.typeAnnotation) {
          const typeStr = this.generateTypeAnnotation(p.typeAnnotation);
          result += `: ${typeStr}`;
        }

        return result;
      } else {
        // Simple identifier
        let result = p.pattern.name;
        
        // Add type annotation if present
        if (p.typeAnnotation) {
          const typeStr = this.generateTypeAnnotation(p.typeAnnotation);
          result += `: ${typeStr}`;
        }
        
        return result;
      }
    })
    .join(', ');

  // Add return type annotation if present
  let returnType = '';
  if (node.returnType) {
    const returnTypeStr = this.generateTypeAnnotation(node.returnType);
    returnType = `: ${returnTypeStr}`;
  }

  if (node.body.type === 'BlockStatement') {
    const savedIndent = this.indentLevel;
    this.indentLevel = 0;
    const body = this.generateStatement(node.body);
    this.indentLevel = savedIndent;
    return `(${params})${returnType} => ${body}`;
  } else {
    return `(${params})${returnType} => ${this.generateExpression(node.body)}`;
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
