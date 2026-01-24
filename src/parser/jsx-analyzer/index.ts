// Export constructor
export { JSXAnalyzer } from './jsx-analyzer.js'

// Export types
export { SJSXAnalyzer } from './jsx-analyzer.types.js'
export type { IJSXAnalyzer } from './jsx-analyzer.types.js'

// Export prototype methods
export { analyze } from './prototype/analyze.js'
export { analyzeChildren } from './prototype/analyze-children.js'
export { analyzeProps } from './prototype/analyze-props.js'
export { extractDependencies } from './prototype/extract-dependencies.js'
export { extractEvents } from './prototype/extract-events.js'
export { isStaticElement } from './prototype/is-static-element.js'
export { isStaticValue } from './prototype/is-static-value.js'

// Export map pattern detection utilities
export { containsMapCall, detectArrayMapPattern, extractKeyFromJSX } from './prototype/map-pattern-detector.js'
export type { IArrayMapPattern } from './prototype/map-pattern-detector.js'

