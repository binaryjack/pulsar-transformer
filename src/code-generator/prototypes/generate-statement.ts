/**
 * CodeGenerator.prototype.generateStatement
 * Route statement generation based on type
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.generateStatement = function (this: ICodeGenerator, node: any): string {
  if (!node) return '';

  switch (node.type) {
    case 'ImportDeclaration':
      // Handled separately in generateImports
      return '';

    case 'ExportNamedDeclaration':
      if (node.declaration) {
        // Generate TypeScript declarations (including interfaces)
        const code = this.generateStatement(node.declaration);
        if (!code) return ''; // If declaration generated nothing, skip export

        // For interface declarations, the generated code already includes 'export'
        if (node.declaration.type === 'InterfaceDeclaration') {
          return code;
        }

        return 'export ' + code;
      }
      // Handle export { Name1, Name2 as Alias } syntax
      if (node.specifiers && node.specifiers.length > 0) {
        const specifierList = node.specifiers
          .map((spec: any) => {
            if (spec.local.name === spec.exported.name) {
              return spec.local.name;
            } else {
              return `${spec.local.name} as ${spec.exported.name}`;
            }
          })
          .join(', ');
        return `export { ${specifierList} };`;
      }
      return '';

    case 'ExportDefaultDeclaration':
      if (node.declaration) {
        // CRITICAL: FunctionDeclaration is a statement, not expression
        // generateExpression() doesn't handle it, causing malformed output
        if (node.declaration.type === 'FunctionDeclaration') {
          const funcCode = this.generateFunction(node.declaration);
          // Replace "function Name" with "export default function Name"
          return funcCode.replace(/^function /, 'export default function ');
        }

        // For expressions (e.g., export default 42)
        const expr = this.generateExpression(node.declaration);
        return 'export default ' + expr + ';';
      }
      return '';

    case 'InterfaceDeclaration':
      // Generate TypeScript interface into the output
      return this.generateInterfaceDeclaration(node);

    case 'ComponentDeclaration':
      return this.generateComponent(node);

    case 'FunctionDeclaration':
      return this.generateFunction(node);

    case 'VariableDeclaration':
      return this.generateVariableDeclaration(node);

    case 'BlockStatement':
      return this.generateBlockStatement(node);

    case 'ReturnStatement':
      // Use string concatenation to avoid $ interpolation in template literals
      return (
        this.indent() +
        'return ' +
        (node.argument ? this.generateExpression(node.argument) : '') +
        ';'
      );

    case 'IfStatement': {
      const test = this.generateExpression(node.test);
      const consequent =
        node.consequent.type === 'BlockStatement'
          ? this.generateBlockStatement(node.consequent)
          : this.generateStatement(node.consequent);

      let result = this.indent() + 'if (' + test + ') ' + consequent;

      if (node.alternate) {
        const alternate =
          node.alternate.type === 'BlockStatement'
            ? ' else ' + this.generateBlockStatement(node.alternate)
            : ' else ' +
              (node.alternate.type === 'IfStatement'
                ? this.generateStatement(node.alternate).trim()
                : this.generateStatement(node.alternate));
        result += alternate;
      }

      return result;
    }

    case 'ForStatement': {
      let init = '';
      if (node.init) {
        if (node.init.type === 'VariableDeclaration') {
          // For variable declarations in for loops, we don't want the trailing semicolon
          const varDecl = this.generateVariableDeclaration(node.init).trim();
          init = varDecl.endsWith(';') ? varDecl.slice(0, -1) : varDecl;
        } else {
          init = this.generateExpression(node.init);
        }
      }

      const test = node.test ? this.generateExpression(node.test) : '';
      const update = node.update ? this.generateExpression(node.update) : '';

      const body =
        node.body.type === 'BlockStatement'
          ? this.generateBlockStatement(node.body)
          : this.generateStatement(node.body);

      return this.indent() + 'for (' + init + '; ' + test + '; ' + update + ') ' + body;
    }

    case 'WhileStatement': {
      const test = this.generateExpression(node.test);
      const body =
        node.body.type === 'BlockStatement'
          ? this.generateBlockStatement(node.body)
          : this.generateStatement(node.body);

      return this.indent() + 'while (' + test + ') ' + body;
    }

    case 'ExpressionStatement':
      // Use string concatenation to avoid $ interpolation in template literals
      return this.indent() + this.generateExpression(node.expression) + ';';

    default:
      return `/* Unhandled statement: ${node.type} */`;
  }
};

/**
 * Generate interface declaration
 */
CodeGenerator.prototype.generateInterface = function (this: ICodeGenerator, node: any): string {
  const parts: string[] = [];

  parts.push(`interface ${node.name.name} {`);

  for (const prop of node.body.properties) {
    const optional = prop.optional ? '?' : '';
    const typeString = this.generateTypeAnnotation(prop.typeAnnotation.typeAnnotation);
    parts.push(`  ${prop.key.name}${optional}: ${typeString};`);
  }

  parts.push('}');

  return parts.join('\n');
};

/**
 * Generate component declaration (transform to function with Registry)
 */
CodeGenerator.prototype.generateComponent = function (this: ICodeGenerator, node: any): string {
  this.addImport('$REGISTRY');

  const parts: string[] = [];

  // Generate parameters with type annotations if present
  const params = node.params
    .map((p: any) => {
      if (p.pattern.type === 'ObjectPattern') {
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
        return `{${props}}`;
      }

      // Simple identifier parameter with optional type annotation
      const paramName = p.pattern.name;
      if (p.typeAnnotation) {
        const typeStr = this.generateTypeAnnotation(p.typeAnnotation);
        return `${paramName}: ${typeStr}`;
      }
      return paramName;
    })
    .join(', ');

  // Note: Return types are TypeScript-only, not included in JavaScript output
  // Type information is preserved in .d.ts files

  parts.push(`function ${node.name.name}(${params}) {`);
  this.indentLevel++;

  // Registry wrapper - execute(id, parentId, factory)
  parts.push(
    `${this.indent()}return $REGISTRY.execute('component:${node.name.name}', null, () => {`
  );
  this.indentLevel++;

  // Body statements
  for (const stmt of node.body.body) {
    const stmtCode = this.generateStatement(stmt);
    // DEBUG: Check for dollar sign in component body statement
    if (stmtCode && stmtCode.includes('item.price')) {
      console.log('[GEN-COMPONENT-DEBUG] Statement in component body:', stmtCode.slice(0, 200));
      console.log("[GEN-COMPONENT-DEBUG] Contains [$':", stmtCode.includes("['$'"));
    }
    parts.push(stmtCode);
  }

  this.indentLevel--;
  parts.push(`${this.indent()}});`);

  this.indentLevel--;
  parts.push('}');

  return parts.join('\n');
};

/**
 * Generate function declaration
 */
CodeGenerator.prototype.generateFunction = function (this: ICodeGenerator, node: any): string {
  const parts: string[] = [];

  const name = node.id ? node.id.name : '';

  // Generate parameters with type annotations if present
  const params = node.params
    .map((p: any) => {
      const paramName = p.pattern.name;
      // Include type annotation if present
      // Note: Parameter types are TypeScript-only, omitted in JavaScript output
      return paramName;
    })
    .join(', ');

  // Note: Return types are TypeScript-only, not included in JavaScript output

  parts.push(`function ${name}(${params}) {`);
  this.indentLevel++;

  for (const stmt of node.body.body) {
    parts.push(this.generateStatement(stmt));
  }

  this.indentLevel--;
  parts.push('}');

  return parts.join('\n');
};

/**
 * Generate variable declaration
 */
CodeGenerator.prototype.generateVariableDeclaration = function (
  this: ICodeGenerator,
  node: any
): string {
  const parts: string[] = [];

  for (const decl of node.declarations) {
    let pattern = '';

    if (decl.id.type === 'ArrayPattern') {
      const elements = decl.id.elements
        .filter((e: any) => e !== null)
        .map((e: any) => e.name)
        .join(', ');
      pattern = `[${elements}]`;
    } else if (decl.id.type === 'ObjectPattern') {
      const props = decl.id.properties.map((p: any) => p.key.name).join(', ');
      pattern = `{${props}}`;
    } else {
      pattern = decl.id.name;
    }

    // Check if initializer is a component arrow function
    // (has HTMLElement return type and returns JSX)
    const isComponentArrow =
      decl.init &&
      decl.init.type === 'ArrowFunctionExpression' &&
      decl.init.returnType &&
      decl.init.returnType.typeName &&
      decl.init.returnType.typeName.name === 'HTMLElement';

    let init = '';
    if (isComponentArrow) {
      this.addImport('$REGISTRY');

      // Generate parameters
      const params = decl.init.params
        .map((p: any) => {
          if (p.pattern.type === 'ObjectPattern') {
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
            if (p.typeAnnotation) {
              const typeStr = this.generateTypeAnnotation(p.typeAnnotation);
              result += `: ${typeStr}`;
            }
            return result;
          } else {
            // Simple identifier parameter (omit TypeScript type annotations in JavaScript)
            return p.pattern.name;
          }
        })
        .join(', ');

      // Note: Return types are TypeScript-only, not included in JavaScript output

      // Generate body wrapped with $REGISTRY.execute()
      let bodyStatements = '';
      if (decl.init.body.type === 'BlockStatement') {
        // Generate statements inside the block without the outer braces
        this.indentLevel++;
        this.indentLevel++; // Extra indent for registry callback
        for (const stmt of decl.init.body.body) {
          bodyStatements += this.generateStatement(stmt) + '\n';
        }
        this.indentLevel--;
        this.indentLevel--;
      } else {
        bodyStatements =
          this.indent() + '    return ' + this.generateExpression(decl.init.body) + ';\n';
      }

      init =
        ' = (' +
        params +
        ') => {\n' +
        this.indent() +
        "  return $REGISTRY.execute('component:" +
        pattern +
        "', null, () => {\n" +
        bodyStatements +
        this.indent() +
        '  });\n' +
        this.indent() +
        '}';
    } else if (decl.init) {
      init = ' = ' + this.generateExpression(decl.init);
    }

    parts.push(this.indent() + node.kind + ' ' + pattern + init + ';');
  }

  return parts.join('\n');
};

/**
 * Generate block statement
 */
CodeGenerator.prototype.generateBlockStatement = function (
  this: ICodeGenerator,
  node: any
): string {
  const parts: string[] = [];

  parts.push(`${this.indent()}{`);
  this.indentLevel++;

  for (const stmt of node.body) {
    parts.push(this.generateStatement(stmt));
  }

  this.indentLevel--;
  parts.push(`${this.indent()}}`);

  return parts.join('\n');
};

/**
 * Generate interface declaration
 * Interfaces are TypeScript-only with no runtime representation
 * Skip them in the JavaScript output (they're already in the .d.ts)
 */
CodeGenerator.prototype.generateInterfaceDeclaration = function (
  this: ICodeGenerator,
  node: any
): string {
  // Interfaces are compile-time only - emit JSDoc comment for documentation
  const parts: string[] = [];

  parts.push(`/**`);
  parts.push(` * @interface ${node.name.name}`);

  for (const prop of node.body.properties) {
    const optional = prop.optional ? '?' : '';

    // Handle TypeAnnotation wrapper
    let actualTypeNode = prop.typeAnnotation;
    if (actualTypeNode && actualTypeNode.type === 'TypeAnnotation') {
      actualTypeNode = actualTypeNode.typeAnnotation;
    }

    const typeStr = this.generateTypeAnnotation(actualTypeNode);
    const optionalMarker = optional ? '=' : '';
    parts.push(` * @property {${typeStr}} ${prop.key.name}${optionalMarker}`);
  }

  parts.push(` */`);

  return parts.join('\n');
};
