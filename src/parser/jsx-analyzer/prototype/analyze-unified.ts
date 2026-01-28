import * as ts from 'typescript'
import { IJSXAnalyzer } from '../jsx-analyzer.types.js'

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
  props: any
  events: any
  isStatic: boolean
  staticnessReason?: string
  hasDynamicChildren: boolean
}

/**
 * Single unified pass that analyzes an element and collects:
 * - Props (with dependency tracking)
 * - Events (extracted from props)
 * - Staticness determination
 * - Child dynamicity detection
 *
 * All collected in ONE AST traversal instead of 3+ separate passes.
 */
export const analyzeElementUnified = function(
  this: IJSXAnalyzer,
  node: ts.Node
): UnifiedAnalysisResult {
  let props: any = {}
  let events: any = {}
  let isStatic = true
  let staticnessReason = ''
  let hasDynamicChildren = false

  // ==================== EXTRACT ATTRIBUTES ====================
  let attributes: ts.JsxAttributes | undefined = undefined

  if (ts.isJsxElement(node)) {
    attributes = node.openingElement.attributes
  } else if (ts.isJsxSelfClosingElement(node)) {
    attributes = node.attributes
  }

  // ==================== UNIFIED ATTRIBUTES ANALYSIS ====================
  // Single pass through attributes collecting: props, events, staticness
  if (attributes && attributes.properties) {
    for (const attr of attributes.properties) {
      // === Check for spread attributes ===
      if (ts.isJsxSpreadAttribute(attr)) {
        isStatic = false
        staticnessReason = 'Spread attributes'
        continue
      }

      if (!ts.isJsxAttribute(attr)) {
        continue
      }

      // Get attribute name safely
      const attrNameNode = attr.name
      let attrName = ''
      
      if (ts.isIdentifier(attrNameNode)) {
        attrName = attrNameNode.text
      } else if (ts.isJsxNamespacedName(attrNameNode)) {
        // For namespaced attributes like xml:lang, get the name part
        attrName = attrNameNode.name.text
      }

      if (!attrName) {
        continue
      }

      const initializer = attr.initializer

      // === Event extraction (replaces extractEvents) ===
      if (attrName.startsWith('on')) {
        const eventName = attrName.substring(2).toLowerCase()
        if (initializer) {
          if (ts.isJsxExpression(initializer) && initializer.expression) {
            events[eventName] = initializer.expression
          } else if (ts.isStringLiteral(initializer)) {
            // Handle string event handlers
            events[eventName] = initializer
          }
        }
        continue // Event handlers are always dynamic
      }

      // === Props analysis (with integrated dependency extraction) ===
      let propValue: any = undefined
      let isDynamic = false

      if (!initializer) {
        // Boolean attribute like `disabled`
        propValue = true
      } else if (ts.isStringLiteral(initializer)) {
        // Static string value
        propValue = initializer.text
      } else if (ts.isJsxExpression(initializer)) {
        if (!initializer.expression) {
          // Empty expression {}
          continue
        }

        // === Integrated dependency extraction (single check) ===
        // Instead of calling extractDependencies which does full AST walk,
        // check for staticness inline
        if (this.isStaticValue(initializer.expression)) {
          propValue = initializer.expression
        } else {
          // Dynamic expression - collect dependencies in same pass
          propValue = {
            type: 'dynamic',
            expression: initializer.expression,
            dependencies: this.extractDependencies(initializer.expression) // Only call if dynamic
          }
          isDynamic = true
          isStatic = false
        }
      } else {
        // Other JSX expressions
        propValue = initializer
        isDynamic = true
        isStatic = false
      }

      props[attrName] = {
        value: propValue,
        isDynamic
      }
    }
  }

  // ==================== CHECK TAG NAME FOR STATICNESS ===
  let tagName = null
  if (ts.isJsxElement(node)) {
    tagName = node.openingElement.tagName
  } else if (ts.isJsxSelfClosingElement(node)) {
    tagName = node.tagName
  }

  // Non-identifier tags (components with module access, etc.) are dynamic
  if (tagName && !ts.isIdentifier(tagName)) {
    isStatic = false
    staticnessReason = 'Complex tag name'
  }

  // Components (uppercase tags) are always assumed dynamic
  if (tagName && ts.isIdentifier(tagName) && tagName.text[0] === tagName.text[0].toUpperCase()) {
    isStatic = false
    staticnessReason = 'Component tag'
  }

  // ==================== CHECK CHILDREN FOR DYNAMICITY ===
  if (ts.isJsxElement(node)) {
    hasDynamicChildren = node.children.some(
      child => ts.isJsxExpression(child) && child.expression
    )
    if (hasDynamicChildren) {
      isStatic = false
      staticnessReason = 'Dynamic children'
    }
  }

  return {
    props,
    events,
    isStatic,
    staticnessReason,
    hasDynamicChildren
  }
}
