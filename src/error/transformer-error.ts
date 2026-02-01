/**
 * Custom error class for transformer errors with full context
 */

import type { IErrorContext } from '../types.js';

/**
 * TransformerError class with rich context
 */
export class TransformerError extends Error {
  public readonly code: string;
  public readonly context: IErrorContext;
  public readonly timestamp: number;

  constructor(message: string, code: string, context: Partial<IErrorContext>) {
    super(message);

    this.name = 'TransformerError';
    this.code = code;
    this.timestamp = Date.now();

    // Ensure all required fields are present
    this.context = {
      sourceFile: context.sourceFile || 'unknown',
      line: context.line ?? -1,
      column: context.column ?? -1,
      offset: context.offset ?? -1,
      sourceSnippet: context.sourceSnippet,
      phase: context.phase || 'unknown',
      nodeType: context.nodeType,
      nodeKind: context.nodeKind,
      astPath: context.astPath || [],
      originalCode: context.originalCode,
      transformedCode: context.transformedCode,
      signalInfo: context.signalInfo,
      componentInfo: context.componentInfo,
      parentContext: context.parentContext,
      sessionId: context.sessionId,
      stackTrace: new Error().stack,
    };

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, TransformerError.prototype);
  }

  /**
   * Create error from AST node
   */
  public static fromNode(
    node: any,
    sourceFile: any,
    message: string,
    code: string,
    additionalContext?: Partial<IErrorContext>
  ): TransformerError {
    const position = getNodePosition(node, sourceFile);
    const snippet = getNodeSnippet(node, sourceFile);
    const astPath = getASTPath(node);

    return new TransformerError(message, code, {
      sourceFile: sourceFile.fileName,
      line: position.line,
      column: position.column,
      offset: position.offset,
      sourceSnippet: snippet,
      nodeType: getNodeTypeName(node),
      nodeKind: node.kind,
      astPath,
      originalCode: node.getText(sourceFile),
      ...additionalContext,
    });
  }

  /**
   * Format error for console output
   */
  public format(): string {
    const lines: string[] = [
      `\n❌ PULSAR TRANSFORMER ERROR`,
      `Code: ${this.code}`,
      `Message: ${this.message}`,
      ``,
      `Location:`,
      `  File: ${this.context.sourceFile}`,
      `  Line: ${this.context.line}:${this.context.column}`,
      `  Phase: ${this.context.phase}`,
    ];

    if (this.context.nodeType) {
      lines.push(`  Node: ${this.context.nodeType} (kind ${this.context.nodeKind})`);
    }

    if (this.context.astPath && this.context.astPath.length > 0) {
      lines.push(`  Path: ${this.context.astPath.join(' → ')}`);
    }

    if (this.context.sourceSnippet) {
      lines.push(``, `Source:`, this.context.sourceSnippet);
    }

    if (this.context.originalCode) {
      lines.push(``, `Original Code:`, this.context.originalCode);
    }

    if (this.context.transformedCode) {
      lines.push(``, `Transformed Code:`, this.context.transformedCode);
    }

    if (this.context.signalInfo) {
      lines.push(
        ``,
        `Signal Info:`,
        `  Type: ${this.context.signalInfo.type}`,
        `  Reactive: ${this.context.signalInfo.isReactive}`,
        `  Memoized: ${this.context.signalInfo.isMemoized}`
      );
    }

    if (this.context.componentInfo) {
      lines.push(
        ``,
        `Component Info:`,
        `  Name: ${this.context.componentInfo.name}`,
        `  ID: ${this.context.componentInfo.componentId}`,
        `  Depth: ${this.context.componentInfo.depth}`
      );
    }

    if (this.context.sessionId) {
      lines.push(``, `Session: ${this.context.sessionId}`);
    }

    return lines.join('\n');
  }

  /**
   * Export error as JSON
   */
  public toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

/**
 * Utility functions (imported from ast-utils)
 */
function getNodePosition(
  node: any,
  sourceFile: any
): { line: number; column: number; offset: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.pos);
  return {
    line: line + 1,
    column: character + 1,
    offset: node.pos,
  };
}

function getNodeSnippet(node: any, sourceFile: any, contextLines: number = 2): string {
  const start = sourceFile.getLineAndCharacterOfPosition(node.pos);
  const end = sourceFile.getLineAndCharacterOfPosition(node.end);

  const lines = sourceFile.text.split('\n');
  const startLine = Math.max(0, start.line - contextLines);
  const endLine = Math.min(lines.length - 1, end.line + contextLines);

  const snippet = lines
    .slice(startLine, endLine + 1)
    .map((line: string, idx: number) => {
      const lineNum = startLine + idx + 1;
      const marker = lineNum === start.line + 1 ? '>' : ' ';
      return `${marker} ${lineNum.toString().padStart(4)} | ${line}`;
    })
    .join('\n');

  return snippet;
}

function getASTPath(node: any): string[] {
  const path: string[] = [];
  let current = node;

  while (current) {
    path.unshift(getNodeTypeName(current));
    current = current.parent;
  }

  return path;
}

function getNodeTypeName(node: any): string {
  const ts = require('typescript');
  return ts.SyntaxKind[node.kind] || `Unknown(${node.kind})`;
}
