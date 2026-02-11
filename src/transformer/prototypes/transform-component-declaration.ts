/**
 * Transform Component Declaration - CRITICAL TRANSFORMATION
 * Converts: component Counter() {...}
 * To: export const Counter = (): HTMLElement => { return $REGISTRY.execute(...); }
 */

import type {
  IArrowFunctionExpression,
  IBlockStatement,
  ICallExpression,
  IComponentDeclaration,
  IIdentifier,
  ILiteral,
  IMemberExpression,
  IReturnStatement,
  IStringLiteral,
  IVariableDeclaration,
  IVariableDeclarator,
} from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Transform component declaration to variable declaration with arrow function
 *
 * Algorithm:
 * 1. Extract component name, params, body
 * 2. Create $REGISTRY.execute() call wrapping body
 * 3. Wrap in return statement
 * 4. Create arrow function with params and HTMLElement return type
 * 5. Create const variable declaration
 * 6. Mark as exported
 * 7. Track $REGISTRY import usage
 */
export function transformComponentDeclaration(
  this: ITransformer,
  node: IComponentDeclaration
): IVariableDeclaration {
  const { name, params, body, exported, start, end } = node;

  // Track import usage
  this.context.usedImports.add('$REGISTRY');

  // Create $REGISTRY.execute call
  const registryObject: IIdentifier = {
    type: 'Identifier',
    name: '$REGISTRY',
    start,
    end,
  };

  const executeProperty: IIdentifier = {
    type: 'Identifier',
    name: 'execute',
    start,
    end,
  };

  const memberExpression: IMemberExpression = {
    type: 'MemberExpression',
    object: registryObject,
    property: executeProperty,
    computed: false,
    start,
    end,
  };

  // Component identifier argument
  const componentIdLiteral: IStringLiteral = {
    type: 'Literal',
    value: `component:${name.name}`,
    raw: `'component:${name.name}'`,
    start,
    end,
  };

  // Original component body wrapped in arrow function
  const bodyArrowFunction: IArrowFunctionExpression = {
    type: 'ArrowFunctionExpression',
    params: [],
    body: body,
    async: false,
    start,
    end,
  };

  // parentId literal (null for top-level components)
  const parentIdLiteral: ILiteral = {
    type: 'Literal',
    value: null,
    raw: 'null',
    start,
    end,
  };

  // $REGISTRY.execute('component:Counter', null, () => { original body })
  const registryCall: ICallExpression = {
    type: 'CallExpression',
    callee: memberExpression,
    arguments: [componentIdLiteral, parentIdLiteral, bodyArrowFunction],
    start,
    end,
  };

  // return $REGISTRY.execute(...)
  const returnStatement: IReturnStatement = {
    type: 'ReturnStatement',
    argument: registryCall,
    start,
    end,
  };

  // { return $REGISTRY.execute(...); }
  const wrappedBody: IBlockStatement = {
    type: 'BlockStatement',
    body: [returnStatement],
    start,
    end,
  };

  // Arrow function: (params) => { return $REGISTRY.execute(...); }
  // Note: Return type will be inferred or added by CodeGenerator
  const arrowFunction: IArrowFunctionExpression = {
    type: 'ArrowFunctionExpression',
    params: params,
    body: wrappedBody,
    async: false,
    start,
    end,
  };

  // Variable declarator: Counter = () => ...
  const declarator: IVariableDeclarator = {
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier',
      name: name.name,
      start,
      end,
    } as IIdentifier,
    init: arrowFunction,
    start,
    end,
  };

  // Variable declaration: export const Counter = ...
  const variableDeclaration: IVariableDeclaration = {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [declarator],
    start,
    end,
  };

  // Preserve exported status
  if (exported) {
    (variableDeclaration as any).exported = true;
  }

  return variableDeclaration;
}
