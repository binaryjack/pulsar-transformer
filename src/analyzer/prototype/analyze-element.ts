/**
 * Analyze PSR Element
 *
 * Converts element AST to ElementIR with static/dynamic classification.
 */

import type { IPSRElementNode } from '../../parser/ast';
import type { IAnalyzerInternal } from '../analyzer.types';
import type { IAttributeIR, IElementIR, IEventHandlerIR, IIRNode, ISignalBindingIR } from '../ir';
import { IRNodeType } from '../ir';

/**
 * Analyze PSR element
 */
export function analyzeElement(this: IAnalyzerInternal, node: IPSRElementNode): IElementIR {
  const tagName = node.tagName;

  // Analyze attributes
  const attributes: IAttributeIR[] = [];
  const eventHandlers: IEventHandlerIR[] = [];

  for (const attr of node.attributes) {
    // Check if attribute is event handler (starts with 'on')
    if (attr.name.startsWith('on')) {
      const eventName = attr.name.slice(2).toLowerCase(); // onClick -> click
      const handler = attr.value ? this._analyzeNode(attr.value) : null;

      if (handler) {
        eventHandlers.push({
          type: IRNodeType.EVENT_HANDLER_IR,
          eventName,
          handler,
          isInline: handler.type === IRNodeType.ARROW_FUNCTION_IR,
          accessesSignals: this._handlerAccessesSignals(handler),
          metadata: {
            sourceLocation: node.location?.start,
          },
        });
      }
    } else {
      // Regular attribute
      const value = attr.value ? this._analyzeNode(attr.value) : null;
      attributes.push({
        name: attr.name,
        value,
        isStatic: attr.isStatic,
        isDynamic: !attr.isStatic,
      });
    }
  }

  // Analyze children
  const children: IIRNode[] = [];
  const signalBindings: ISignalBindingIR[] = [];

  for (const child of node.children) {
    const childIR = this._analyzeNode(child);
    if (childIR) {
      children.push(childIR);

      // Collect signal bindings
      if (childIR.type === IRNodeType.SIGNAL_BINDING_IR) {
        signalBindings.push(childIR as ISignalBindingIR);
      }
    }
  }

  // Determine if element is static (no dynamic content)
  const isStatic =
    attributes.every((attr) => attr.isStatic) &&
    signalBindings.length === 0 &&
    eventHandlers.length === 0 &&
    children.every((child) => child.type === IRNodeType.LITERAL_IR);

  // Build ElementIR
  const elementIR: IElementIR = {
    type: IRNodeType.ELEMENT_IR,
    tagName,
    attributes,
    children,
    selfClosing: node.selfClosing,
    isStatic,
    eventHandlers,
    signalBindings,
    metadata: {
      sourceLocation: node.location?.start,
      optimizations: {
        isStatic,
        canInline: isStatic && children.length === 0,
      },
    },
  };

  return elementIR;
}

/**
 * Check if handler accesses signals
 */
function _handlerAccessesSignals(this: IAnalyzerInternal, handler: IIRNode): boolean {
  // Simple check: if handler body contains identifier that is a signal
  if (handler.type === IRNodeType.ARROW_FUNCTION_IR) {
    const captures = (handler as any).captures || [];
    return captures.some((name: string) => this._isSignal(name));
  }
  return false;
}

// Export helper
export { _handlerAccessesSignals };
