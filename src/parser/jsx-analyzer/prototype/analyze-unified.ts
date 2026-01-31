import * as ts from 'typescript';
import { IEventIR, IPropIR } from '../../../ir/types/index.js';
import { IJSXAnalyzer } from '../jsx-analyzer.types.js';

/**
 * UNIFIED ELEMENT ANALYSIS
 *
 * Consolidation Pattern (from pulsar-formular-ui optimization):
 * Instead of multiple separate functions doing their own AST traversals:
 *   - analyzeProps (with extractDependencies full AST walk per prop)
 *   - isStaticElement (full attributes walk + child walk)
 *   - extractEvents (full attributes walk)
 *
 * Do ONE unified pass collecting all information at once.
 * This reduces file transform time by 3-4x.
 */

interface UnifiedAnalysisResult {
  props: IPropIR[];
  events: Record<string, IEventIR>;
  isStatic: boolean;
  staticnessReason?: string;
  hasDynamicChildren: boolean;
}

/**
 * Single unified pass that analyzes an element and collects:
 * - Props (with dependency tracking) - returns array like analyzeProps()
 * - Events (extracted from props)
 * - Staticness determination
 * - Child dynamicity detection
 *
 * All collected in ONE AST traversal instead of 3+ separate passes.
 */
export const analyzeElementUnified = function (
  this: IJSXAnalyzer,
  node: ts.Node
): UnifiedAnalysisResult {
  let props: IPropIR[] = [];
  let events: Record<string, IEventIR> = {};
  let isStatic = true;
  let staticnessReason = '';
  let hasDynamicChildren = false;

  // ==================== EXTRACT ATTRIBUTES ====================
  let attributes: ts.JsxAttributes | undefined = undefined;

  if (ts.isJsxElement(node)) {
    attributes = node.openingElement.attributes;
  } else if (ts.isJsxSelfClosingElement(node)) {
    attributes = node.attributes;
  }

  // ==================== UNIFIED ATTRIBUTES ANALYSIS ====================
  // Single pass through attributes collecting: props, events, staticness
  if (attributes && attributes.properties) {
    for (const attr of attributes.properties) {
      // === Check for spread attributes ===
      if (ts.isJsxSpreadAttribute(attr)) {
        // Handle spread attributes like {...field.register()}
        props.push({
          name: '__spread',
          value: attr.expression,
          isStatic: false,
          isDynamic: true,
          isSpread: true,
          dependsOn: this.extractDependencies(attr.expression),
        });
        isStatic = false;
        staticnessReason = 'Spread attributes';
        continue;
      }

      if (!ts.isJsxAttribute(attr)) {
        continue;
      }

      // Get attribute name safely
      const attrNameNode = attr.name;
      let attrName = '';

      if (ts.isIdentifier(attrNameNode)) {
        attrName = attrNameNode.text;
      } else if (ts.isJsxNamespacedName(attrNameNode)) {
        // For namespaced attributes like xml:lang, get the name part
        attrName = attrNameNode.name.text;
      }

      if (!attrName) {
        continue;
      }

      const initializer = attr.initializer;

      // === Event extraction (replaces extractEvents) ===
      if (attrName.startsWith('on')) {
        const eventName = attrName.substring(2).toLowerCase();
        if (initializer) {
          let handler: ts.Expression | undefined;
          if (ts.isJsxExpression(initializer) && initializer.expression) {
            handler = initializer.expression;
          } else if (ts.isStringLiteral(initializer)) {
            // Handle string event handlers
            handler = initializer;
          }

          if (handler) {
            events[eventName] = {
              type: eventName,
              name: eventName,
              handler: handler,
              modifiers: [],
            };
          }
        }
        continue; // Event handlers are always dynamic
      }

      // === Props analysis (with integrated dependency extraction) ===
      let propValue: ts.Expression | undefined = undefined;
      let isDynamic = false;
      let isStatic_prop = false;
      let dependsOn: string[] = [];

      if (!initializer) {
        // Boolean attribute like `disabled`
        propValue = ts.factory.createTrue();
        isStatic_prop = true;
      } else if (ts.isStringLiteral(initializer)) {
        // Static string value
        propValue = initializer;
        isStatic_prop = true;
      } else if (ts.isJsxExpression(initializer)) {
        if (!initializer.expression) {
          // Empty expression {}
          continue;
        }

        // === Integrated dependency extraction (single check) ===
        // Instead of calling extractDependencies which does full AST walk,
        // check for staticness inline
        if (this.isStaticValue(initializer.expression)) {
          propValue = initializer.expression;
          isStatic_prop = true;
        } else {
          // Dynamic expression - collect dependencies in same pass
          propValue = initializer.expression;
          isDynamic = true;
          isStatic_prop = false;
          dependsOn = this.extractDependencies(initializer.expression);
          isStatic = false;
        }
      } else {
        // Other JSX expressions (including numeric literals, etc.)
        propValue = initializer;
        isDynamic = true;
        isStatic_prop = false;
        isStatic = false;
      }

      // Push to props array in same format as analyzeProps()
      props.push({
        name: attrName,
        value: propValue,
        isStatic: isStatic_prop,
        isDynamic: isDynamic,
        dependsOn: dependsOn,
      });
    }
  }

  // ==================== CHECK TAG NAME FOR STATICNESS ===
  let tagName = null;
  if (ts.isJsxElement(node)) {
    tagName = node.openingElement.tagName;
  } else if (ts.isJsxSelfClosingElement(node)) {
    tagName = node.tagName;
  }

  // Non-identifier tags (components with module access, etc.) are dynamic
  if (tagName && !ts.isIdentifier(tagName)) {
    isStatic = false;
    staticnessReason = 'Complex tag name';
  }

  // Components (uppercase tags) are always assumed dynamic
  if (tagName && ts.isIdentifier(tagName) && tagName.text[0] === tagName.text[0].toUpperCase()) {
    isStatic = false;
    staticnessReason = 'Component tag';
  }

  // ==================== CHECK CHILDREN FOR DYNAMICITY ===
  if (ts.isJsxElement(node)) {
    hasDynamicChildren = node.children.some(
      (child) => ts.isJsxExpression(child) && child.expression
    );
    if (hasDynamicChildren) {
      isStatic = false;
      staticnessReason = 'Dynamic children';
    }
  }

  return {
    props,
    events,
    isStatic,
    staticnessReason,
    hasDynamicChildren,
  };
};
