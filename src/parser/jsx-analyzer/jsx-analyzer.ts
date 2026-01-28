import { ITransformationContext } from '../../context/transformation-context.types.js'
import { IJSXAnalyzer } from './jsx-analyzer.types.js'

// Import prototype methods
import { analyze } from './prototype/analyze.js'
import { analyzeChildren } from './prototype/analyze-children.js'
import { analyzeProps } from './prototype/analyze-props.js'
import { extractDependencies } from './prototype/extract-dependencies.js'
import { extractEvents } from './prototype/extract-events.js'
import { analyzeElementUnified } from './prototype/analyze-unified.js'

import { isStaticElement } from './prototype/is-static-element.js'
import { isStaticValue } from './prototype/is-static-value.js'

/**
 * JSXAnalyzer constructor function (prototype-based class)
 * Analyzes JSX AST nodes and extracts component structure
 */
export const JSXAnalyzer = function(
    this: IJSXAnalyzer,
    context: ITransformationContext
) {
    Object.defineProperty(this, 'context', {
        value: context,
        writable: false,
        configurable: false,
        enumerable: true
    })
} as any as { new (context: ITransformationContext): IJSXAnalyzer }

// Attach prototype methods
Object.assign(JSXAnalyzer.prototype, {
    analyze,
    analyzeProps,
    analyzeChildren,
    isStaticElement,
    isStaticValue,
    extractDependencies,
    extractEvents,
    analyzeElementUnified
})
