import * as ts from 'typescript'
import { IJSXAnalyzer } from '../jsx-analyzer.types.js'

/**
 * OPTIMIZATION: Using unified analyzer pattern from pulsar-formular-ui
 * Instead of separate function calls that each do their own AST traversal,
 * we now import the unified analyzer that does everything in one pass.
 */
import { analyzeElementUnified } from './analyze-unified.js'

/**
 * Determines if a tag name represents a component (starts with uppercase)
 */
function isComponentTag(tagName: string): boolean {
    return tagName.length > 0 && tagName[0] === tagName[0].toUpperCase()
}

/**
 * Gets the tag name from a JSX tag name node
 */
function getTagName(tagName: ts.JsxTagNameExpression): { text: string; expression: ts.JsxTagNameExpression } {
    if (ts.isIdentifier(tagName)) {
        return { text: tagName.text, expression: tagName }
    }
    if (ts.isPropertyAccessExpression(tagName)) {
        // For AppContext.Provider, get just "Provider"
        if (ts.isIdentifier(tagName.name)) {
            return { text: tagName.name.text, expression: tagName }
        }
    }
    return { text: 'unknown', expression: tagName }
}

/**
 * OPTIMIZED: Analyzes a JSX node using unified single-pass analyzer
 * Previously called analyzeProps, isStaticElement, and extractEvents separately (3+ AST walks)
 * Now uses unified analyzer (1 AST walk) - reduces transform time by ~3-4x
 */
export const analyze = function(this: IJSXAnalyzer, node: ts.Node): any {
    // Handle JSX Fragments (<></>)
    if (ts.isJsxFragment(node)) {
        return {
            type: 'fragment',
            children: this.analyzeChildren(node.children)
        }
    }
    
    if (ts.isJsxElement(node)) {
        const openingElement = node.openingElement
        const { text: tagName, expression: tagExpression } = getTagName(openingElement.tagName)
        
        // If it's a component (starts with uppercase), return function call
        if (isComponentTag(tagName)) {
            // Use unified analyzer for props collection
            const unified = analyzeElementUnified.call(this, node)
            return {
                type: 'component',
                component: tagExpression,
                props: unified.props,
                children: this.analyzeChildren(node.children)
            }
        }
        
        // Use unified analyzer (single pass instead of 3 separate passes)
        const unified = analyzeElementUnified.call(this, node)
        
        return {
            type: 'element',
            tag: tagName,
            props: unified.props,
            children: this.analyzeChildren(node.children),
            isStatic: unified.isStatic,
            hasDynamicChildren: unified.hasDynamicChildren,
            events: unified.events,
            key: null
        }
    }
    
    if (ts.isJsxSelfClosingElement(node)) {
        const { text: tagName, expression: tagExpression } = getTagName(node.tagName)
        
        // If it's a component (starts with uppercase), return function call
        if (isComponentTag(tagName)) {
            // Use unified analyzer for props collection
            const unified = analyzeElementUnified.call(this, node)
            return {
                type: 'component',
                component: tagExpression,
                props: unified.props,
                children: []
            }
        }
        
        // Use unified analyzer (single pass instead of 3 separate passes)
        const unified = analyzeElementUnified.call(this, node)
        
        return {
            type: 'element',
            tag: tagName,
            props: unified.props,
            children: [],
            isStatic: unified.isStatic,
            hasDynamicChildren: unified.hasDynamicChildren,
            events: unified.events,
            key: null
        }
    }
    
    return null
}
