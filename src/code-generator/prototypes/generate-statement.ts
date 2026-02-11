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
        const code = this.generateStatement(node.declaration);
        return `export ${code}`;
      }
      return '';

    case 'ExportDefaultDeclaration':
      if (node.declaration) {
        const expr = this.generateExpression(node.declaration);
        return `export default ${expr};`;
      }
      return '';

    case 'InterfaceDeclaration':
      return this.generateInterface(node);

    case 'ComponentDeclaration':
      return this.generateComponent(node);

    case 'FunctionDeclaration':
      return this.generateFunction(node);

    case 'VariableDeclaration':
      return this.generateVariableDeclaration(node);

    case 'BlockStatement':
      return this.generateBlockStatement(node);

    case 'ReturnStatement':
      return `${this.indent()}return ${node.argument ? this.generateExpression(node.argument) : ''};`;

    case 'IfStatement': {
      const test = this.generateExpression(node.test);
      const consequent =
        node.consequent.type === 'BlockStatement'
          ? this.generateBlockStatement(node.consequent)
          : this.generateStatement(node.consequent);

      let result = `${this.indent()}if (${test}) ${consequent}`;

      if (node.alternate) {
        const alternate =
          node.alternate.type === 'BlockStatement'
            ? ` else ${this.generateBlockStatement(node.alternate)}`
            : ` else ${node.alternate.type === 'IfStatement' ? this.generateStatement(node.alternate).trim() : this.generateStatement(node.alternate)}`;
        result += alternate;
      }

      return result;
    }

    case 'ExpressionStatement':
      return `${this.indent()}${this.generateExpression(node.expression)};`;

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

  // Generate type parameters: <T> or <T, U>
  let typeParams = '';
  if (node.typeParameters && node.typeParameters.length > 0) {
    const typeParamStrings = node.typeParameters.map((tp: any) => tp.name);
    typeParams = `<${typeParamStrings.join(', ')}>`;
  }

  // Function signature
  const params = node.params
    .map((p: any) => {
      if (p.pattern.type === 'ObjectPattern') {
        const props = p.pattern.properties.map((prop: any) => prop.key.name).join(', ');
        const typeAnnotation = p.typeAnnotation
          ? `: ${this.generateTypeAnnotation(p.typeAnnotation)}`
          : '';
        return `{${props}}${typeAnnotation}`;
      }
      let paramStr = p.pattern.name;
      if (p.optional) {
        paramStr += '?';
      }
      if (p.typeAnnotation) {
        paramStr += `: ${this.generateTypeAnnotation(p.typeAnnotation)}`;
      }
      return paramStr;
    })
    .join(', ');

  parts.push(`function ${node.name.name}${typeParams}(${params}): HTMLElement {`);
  this.indentLevel++;

  // Registry wrapper - execute(id, parentId, factory)
  parts.push(
    `${this.indent()}return $REGISTRY.execute('component:${node.name.name}', null, () => {`
  );
  this.indentLevel++;

  // Body statements
  for (const stmt of node.body.body) {
    parts.push(this.generateStatement(stmt));
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

  // Generate type parameters: <T> or <T, U> or <T extends Base>
  let typeParams = '';
  if (node.typeParameters && node.typeParameters.length > 0) {
    const typeParamStrings = node.typeParameters.map((tp: any) => {
      let result = tp.name;
      if (tp.constraint) {
        result += ` extends ${this.generateTypeAnnotation(tp.constraint)}`;
      }
      if (tp.default) {
        result += ` = ${this.generateTypeAnnotation(tp.default)}`;
      }
      return result;
    });
    typeParams = `<${typeParamStrings.join(', ')}>`;
  }

  // Generate parameters with type annotations
  const params = node.params
    .map((p: any) => {
      let paramStr = p.pattern.name;
      if (p.optional) {
        paramStr += '?';
      }
      if (p.typeAnnotation) {
        // Add type annotation: param: Type or param?: Type
        const typeStr = this.generateTypeAnnotation(p.typeAnnotation);
        paramStr += `: ${typeStr}`;
      }
      return paramStr;
    })
    .join(', ');

  const returnType = node.returnType
    ? `: ${this.generateTypeAnnotation(node.returnType.typeAnnotation)}`
    : '';

  parts.push(`function ${name}${typeParams}(${params})${returnType} {`);
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
            return p.pattern.name;
          }
        })
        .join(', ');

      const returnType = this.generateTypeAnnotation(decl.init.returnType);

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
        bodyStatements = `${this.indent()}    return ${this.generateExpression(decl.init.body)};\n`;
      }

      init = ` = (${params}): ${returnType} => {
${this.indent()}  return $REGISTRY.execute('component:${pattern}', null, () => {
${bodyStatements}${this.indent()}  });
${this.indent()}}`;
    } else if (decl.init) {
      init = ` = ${this.generateExpression(decl.init)}`;
    }

    parts.push(`${this.indent()}${node.kind} ${pattern}${init};`);
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
