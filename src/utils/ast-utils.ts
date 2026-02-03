/**
 * AST position utilities for error reporting
 */

import * as ts from 'typescript';
import { IPosition } from '../types.js';

/**
 * Get detailed position information from a node
 */
export function getNodePosition(node: ts.Node, sourceFile: ts.SourceFile): IPosition {
  const start = node.getStart(sourceFile);
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);

  return {
    line: line + 1, // 1-indexed for humans
    column: character + 1,
    offset: start,
  };
}

/**
 * Get source code snippet around a node for error context
 */
export function getNodeSnippet(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  contextLines: number = 2
): string {
  const start = node.getStart(sourceFile);
  const end = node.getEnd();

  const startPos = sourceFile.getLineAndCharacterOfPosition(start);
  const endPos = sourceFile.getLineAndCharacterOfPosition(end);

  const startLine = Math.max(0, startPos.line - contextLines);
  const lines = sourceFile.text.split('\n');
  const totalLines = lines.length;
  const endLine = Math.min(totalLines - 1, endPos.line + contextLines);

  const result: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    const lineStart = sourceFile.getPositionOfLineAndCharacter(i, 0);
    const lineEnd =
      i < totalLines - 1 ? sourceFile.getPositionOfLineAndCharacter(i + 1, 0) : sourceFile.getEnd();

    const lineText = sourceFile.text.substring(lineStart, lineEnd).trimEnd();
    const marker = i === startPos.line ? ' // <-- HERE' : '';
    lines.push(`${String(i + 1).padStart(4)}: ${lineText}${marker}`);
  }

  return lines.join('\n');
}

/**
 * Get AST path from root to node (for error context)
 */
export function getASTPath(node: ts.Node): string[] {
  const path: string[] = [];
  let current: ts.Node | undefined = node;

  while (current) {
    path.unshift(ts.SyntaxKind[current.kind]);
    current = current.parent;
  }

  return path;
}

/**
 * Get readable node type name
 */
export function getNodeTypeName(node: ts.Node | undefined): string {
  if (!node) return 'Unknown';
  return ts.SyntaxKind[node.kind] || `Unknown(${node.kind})`;
}
