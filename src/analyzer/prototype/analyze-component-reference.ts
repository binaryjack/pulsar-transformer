/**
 * Analyze Component Reference
 *
 * Converts PSR component references (<Card />) to ComponentCallIR
 */

import type { IPSRComponentReferenceNode } from '../../parser/ast/index.js';
import type { IAnalyzerInternal } from '../analyzer.types.js';
import type { IAttributeIR, IComponentCallIR } from '../ir/ir-node-types.js';
import { IRNodeType } from '../ir/ir-node-types.js';

/**
 * Analyze a component reference
 *
 * @example
 * <Card /> → ComponentCallIR
 * <Button onClick={handle}>Click</Button> → ComponentCallIR with attributes and children
 */
export function analyzeComponentReference(
  this: IAnalyzerInternal,
  node: IPSRComponentReferenceNode
): IComponentCallIR {
  // Analyze attributes
  const attributes = node.attributes
    .map((attr: any) => {
      if (attr.type === 'PSRAttribute') {
        return {
          name: attr.name,
          value: attr.value ? this._analyzeNode(attr.value) : null,
          isStatic: attr.isStatic,
          isDynamic: !attr.isStatic,
        };
      } else if (attr.type === 'PSRSpreadAttribute') {
        return {
          name: '...',
          value: this._analyzeNode(attr.argument),
          isStatic: false,
          isDynamic: true,
        };
      }
      return null;
    })
    .filter((a): a is IAttributeIR => a !== null);

  // Analyze children
  const children = node.children.map((child: any) => this._analyzeNode(child));

  return {
    type: IRNodeType.COMPONENT_CALL_IR,
    componentName: node.componentName,
    attributes,
    children,
    selfClosing: node.selfClosing,
    metadata: {
      sourceLocation: {
        line: node.location.start.line,
        column: node.location.start.column,
        offset: node.location.start.offset,
      },
    },
  };
}
