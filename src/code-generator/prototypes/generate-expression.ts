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
        // Escape special characters in string literals
        const escaped = node.value
          .replace(/\\/g, '\\\\') // Backslash first!
          .replace(/'/g, "\\'") // Single quotes
          .replace(/\n/g, '\\n') // Newlines
          .replace(/\r/g, '\\r') // Carriage returns
          .replace(/\t/g, '\\t') // Tabs
          .replace(/\f/g, '\\f') // Form feeds
          .replace(/\v/g, '\\v'); // Vertical tabs
        return `'${escaped}'`;
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

    case 'AssignmentExpression':
      return `${this.generateExpression(node.left)} ${node.operator} ${this.generateExpression(node.right)}`;

    case 'UnaryExpression':
      return `${node.operator}${this.generateExpression(node.argument)}`;

    case 'UpdateExpression':
      const arg = this.generateExpression(node.argument);
      return node.prefix ? `${node.operator}${arg}` : `${arg}${node.operator}`;

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

        // Include type annotation if present
        if (p.typeAnnotation) {
          const typeStr = this.generateTypeAnnotation(p.typeAnnotation);
          return `{${props}}: ${typeStr}`;
        }
        console.log('[DEBUG-ARROW-PARAM] No typeAnnotation found for ObjectPattern');
        return `{${props}}`;
      } else {
        // Simple identifier - include type annotation if present
        const paramName = p.pattern.name;
        if (p.typeAnnotation) {
          const typeStr = this.generateTypeAnnotation(p.typeAnnotation);
          return `${paramName}: ${typeStr}`;
        }
        console.log('[DEBUG-ARROW-PARAM] No typeAnnotation found for identifier:', paramName);
        return paramName;
      }
    })
    .join(', ');

  // Generate return type if present
  let returnTypeStr = '';
  if (node.returnType) {
    returnTypeStr = `: ${this.generateTypeAnnotation(node.returnType.typeAnnotation)}`;
  }

  if (node.body.type === 'BlockStatement') {
    // For arrow functions with block body, manually handle braces
    // to avoid indentation issues with generateBlockStatement
    const statements: string[] = [];
    this.indentLevel++;
    for (const stmt of node.body.body) {
      statements.push(this.generateStatement(stmt));
    }
    this.indentLevel--;

    const body =
      statements.length > 0 ? '{\n' + statements.join('\n') + '\n' + this.indent() + '}' : '{}';

    return '(' + params + ')' + returnTypeStr + ' => ' + body;
  } else {
    // Use string concatenation instead of template literals to avoid $ interpolation issues
    return '(' + params + ')' + returnTypeStr + ' => ' + this.generateExpression(node.body);
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

  // DEBUG: Track all calls
  console.log('[TLITERAL] Called with:', JSON.stringify(node, null, 2).substring(0, 200));

  // Simple template literal without expressions - convert to string
  if (expressions.length === 0) {
    const escaped = quasis[0].value.cooked
      .replace(/\\/g, '\\\\') // Backslash first!
      .replace(/'/g, "\\'") // Single quotes
      .replace(/\n/g, '\\n') // Newlines
      .replace(/\r/g, '\\r') // Carriage returns
      .replace(/\t/g, '\\t') // Tabs
      .replace(/\f/g, '\\f') // Form feeds
      .replace(/\v/g, '\\v'); // Vertical tabs
    return `'${escaped}'`;
  }

  // Template with expressions - preserve as template literal
  const parts: string[] = [];

  for (let i = 0; i < quasis.length; i++) {
    const quasi = quasis[i];

    // Add template string part (raw value preserves escapes)
    const raw = quasi.value.raw || quasi.value.cooked || '';
    parts.push(raw);

    // Add expression if not the last quasi
    if (i < expressions.length) {
      const expr = this.generateExpression(expressions[i]);
      parts.push('${' + expr + '}');
    }
  }

  // Reconstruct as template literal using string concatenation to avoid evaluation
  if (parts.join('').includes('price')) {
    console.log('[FIX-DEBUG] parts array:', JSON.stringify(parts));
    console.log('[FIX-DEBUG] joined:', parts.join(''));
    console.log('[FIX-DEBUG] result:', '`' + parts.join('') + '`');
  }
  return '`' + parts.join('') + '`';
};
