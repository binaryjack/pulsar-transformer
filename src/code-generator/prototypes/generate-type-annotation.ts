/**
 * CodeGenerator.prototype.generateTypeAnnotation
 * Generate TypeScript type annotation string from AST type nodes
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

/**
 * Generate type annotation string
 * Handles: TypeReference, UnionType, LiteralType, ArrayType, FunctionType
 */
CodeGenerator.prototype.generateTypeAnnotation = function (
  this: ICodeGenerator,
  typeNode: any
): string {
  if (!typeNode) return 'any';

  switch (typeNode.type) {
    case 'TypeReference':
      // Simple identifier type: string, number, HTMLElement
      return typeNode.typeName.name;

    case 'UnionType':
      // Union: A | B | C
      return typeNode.types.map((t: any) => this.generateTypeAnnotation(t)).join(' | ');

    case 'LiteralType':
      // String literal: 'primary', number literal: 42
      const literal = typeNode.literal;
      if (typeof literal.value === 'string') {
        return `'${literal.value}'`;
      } else if (literal.value === null) {
        return 'null';
      } else if (literal.value === undefined) {
        return 'undefined';
      } else if (typeof literal.value === 'boolean') {
        return String(literal.value);
      }
      return String(literal.value);

    case 'ArrayType':
      // Array: T[]
      return `${this.generateTypeAnnotation(typeNode.elementType)}[]`;

    case 'FunctionType': {
      // Function: () => ReturnType or (param: Type) => ReturnType
      const params = typeNode.parameters || [];
      const paramStrings = params.map((p: any) => {
        const typeStr = this.generateTypeAnnotation(p.typeAnnotation);
        return `${p.name}: ${typeStr}`;
      });
      const paramList = paramStrings.join(', ');
      const returnTypeStr = this.generateTypeAnnotation(typeNode.returnType);
      return `(${paramList}) => ${returnTypeStr}`;
    }

    default:
      return 'any';
  }
};
