/**
 * Transformer Debug Tools - Advanced debugging utilities for AST transformation
 * Similar to lexer debug tools but focused on AST transformation debugging
 */

import type { ITransformContext, ITransformResult } from './transformer.types.js';
import type { IASTNode } from '../parser/parser.types.js';
import type { ITransformerDiagnostic } from './diagnostics.js';
import type { ITransformationSession } from './state-tracker.js';

export interface ITransformerDebugConfig {
  enabled: boolean;
  verboseLogging: boolean;
  astDumping: boolean;
  performanceTracking: boolean;
  memoryTracking: boolean;
  stepByStepMode: boolean;
  breakpoints: string[];
  outputPath?: string;
}

export interface ITransformerDebugInfo {
  sessionId: string;
  timestamp: string;
  phase: string;
  nodeType: string;
  nodeData: any;
  transformationResult?: any;
  performance: {
    startTime: number;
    endTime: number;
    duration: number;
    memoryUsage?: number;
  };
  diagnostics: ITransformerDiagnostic[];
  metadata: Record<string, any>;
}

/**
 * Advanced transformer debugger with detailed AST inspection
 */
export class TransformerDebugger {
  private config: ITransformerDebugConfig;
  private debugLog: ITransformerDebugInfo[] = [];
  private activeBreakpoints: Set<string> = new Set();
  private stepMode: boolean = false;

  constructor(config: Partial<ITransformerDebugConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? false,
      verboseLogging: config.verboseLogging ?? false,
      astDumping: config.astDumping ?? false,
      performanceTracking: config.performanceTracking ?? true,
      memoryTracking: config.memoryTracking ?? false,
      stepByStepMode: config.stepByStepMode ?? false,
      breakpoints: config.breakpoints ?? [],
      outputPath: config.outputPath,
    };

    this.activeBreakpoints = new Set(this.config.breakpoints);
    this.stepMode = this.config.stepByStepMode;
  }

  /**
   * Log transformation step with detailed information
   */
  logTransformationStep(
    sessionId: string,
    phase: string,
    nodeType: string,
    node: IASTNode,
    result?: any,
    diagnostics: ITransformerDiagnostic[] = []
  ): void {
    if (!this.config.enabled) return;

    const timestamp = new Date().toISOString();
    const startTime = performance.now();

    const debugInfo: ITransformerDebugInfo = {
      sessionId,
      timestamp,
      phase,
      nodeType,
      nodeData: this.config.astDumping ? this.sanitizeNode(node) : { type: nodeType },
      transformationResult: result ? this.sanitizeNode(result) : undefined,
      performance: {
        startTime,
        endTime: startTime, // Will be updated
        duration: 0,
        memoryUsage: this.config.memoryTracking ? this.getMemoryUsage() : undefined,
      },
      diagnostics: [...diagnostics],
      metadata: {
        hasChildren: this.hasChildren(node),
        depth: this.getNodeDepth(node),
        complexity: this.getNodeComplexity(node),
      },
    };

    this.debugLog.push(debugInfo);

    if (this.config.verboseLogging) {
      console.log(`[TRANSFORMER-DEBUG] ${phase} -> ${nodeType}`, {
        timestamp,
        sessionId,
        nodeData: debugInfo.nodeData,
        diagnostics: diagnostics.length,
      });
    }

    // Check for breakpoints
    if (this.shouldBreak(phase, nodeType)) {
      this.handleBreakpoint(phase, nodeType, debugInfo);
    }
  }

  /**
   * Log transformation completion
   */
  logTransformationComplete(
    sessionId: string,
    result: ITransformResult,
    session: ITransformationSession
  ): void {
    if (!this.config.enabled) return;

    console.log(`[TRANSFORMER-DEBUG] Transformation completed for session ${sessionId}`, {
      totalDuration: session.totalDuration,
      transformedNodes: session.metadata.transformedNodes,
      errors: result.context.errors.length,
      diagnostics: this.debugLog.filter((log) => log.sessionId === sessionId).length,
    });

    if (this.config.outputPath) {
      this.exportDebugData(sessionId);
    }
  }

  /**
   * Dump AST structure for inspection
   */
  dumpAST(node: IASTNode, title: string = 'AST Dump'): void {
    if (!this.config.enabled || !this.config.astDumping) return;

    console.group(`[TRANSFORMER-AST] ${title}`);
    console.log(JSON.stringify(this.sanitizeNode(node), null, 2));
    console.groupEnd();
  }

  /**
   * Compare AST before and after transformation
   */
  compareAST(originalNode: IASTNode, transformedNode: IASTNode, operation: string): void {
    if (!this.config.enabled || !this.config.astDumping) return;

    console.group(`[TRANSFORMER-COMPARE] ${operation}`);
    console.log('BEFORE:', JSON.stringify(this.sanitizeNode(originalNode), null, 2));
    console.log('AFTER:', JSON.stringify(this.sanitizeNode(transformedNode), null, 2));

    // Simple diff highlighting
    const diff = this.getASTDiff(originalNode, transformedNode);
    if (diff.length > 0) {
      console.log('CHANGES:', diff);
    }
    console.groupEnd();
  }

  /**
   * Add breakpoint
   */
  addBreakpoint(identifier: string): void {
    this.activeBreakpoints.add(identifier);
    console.log(`[TRANSFORMER-DEBUG] Breakpoint added: ${identifier}`);
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(identifier: string): void {
    this.activeBreakpoints.delete(identifier);
    console.log(`[TRANSFORMER-DEBUG] Breakpoint removed: ${identifier}`);
  }

  /**
   * Enable step mode
   */
  enableStepMode(): void {
    this.stepMode = true;
    console.log('[TRANSFORMER-DEBUG] Step mode enabled - transformation will pause at each step');
  }

  /**
   * Disable step mode
   */
  disableStepMode(): void {
    this.stepMode = false;
    console.log('[TRANSFORMER-DEBUG] Step mode disabled');
  }

  /**
   * Get debug statistics
   */
  getDebugStats() {
    const totalSteps = this.debugLog.length;
    const byPhase = this.debugLog.reduce(
      (acc, log) => {
        acc[log.phase] = (acc[log.phase] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byNodeType = this.debugLog.reduce(
      (acc, log) => {
        acc[log.nodeType] = (acc[log.nodeType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const averageDuration =
      this.debugLog.reduce((sum, log) => sum + log.performance.duration, 0) / totalSteps;

    return {
      totalSteps,
      byPhase,
      byNodeType,
      averageDuration,
      totalDiagnostics: this.debugLog.reduce((sum, log) => sum + log.diagnostics.length, 0),
    };
  }

  /**
   * Clear debug log
   */
  clearDebugLog(): void {
    this.debugLog = [];
    console.log('[TRANSFORMER-DEBUG] Debug log cleared');
  }

  /**
   * Export debug data to file
   */
  exportDebugData(sessionId?: string): void {
    if (!this.config.outputPath) return;

    const dataToExport = sessionId
      ? this.debugLog.filter((log) => log.sessionId === sessionId)
      : this.debugLog;

    const filename = `transformer-debug-${sessionId || Date.now()}.json`;

    try {
      // In Node.js environment
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(this.config.outputPath, filename);
        fs.writeFileSync(
          fullPath,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              sessionId,
              config: this.config,
              stats: this.getDebugStats(),
              debugLog: dataToExport,
            },
            null,
            2
          )
        );
        console.log(`[TRANSFORMER-DEBUG] Debug data exported to: ${fullPath}`);
      }
    } catch (error) {
      console.error('[TRANSFORMER-DEBUG] Failed to export debug data:', error);
    }
  }

  // Private helper methods

  private sanitizeNode(node: any): any {
    if (!node || typeof node !== 'object') return node;

    // Remove circular references and large objects
    const seen = new WeakSet();
    return JSON.parse(
      JSON.stringify(node, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        // Skip very long strings and functions
        if (typeof value === 'string' && value.length > 1000) {
          return value.substring(0, 1000) + '... [truncated]';
        }
        if (typeof value === 'function') {
          return '[Function]';
        }
        return value;
      })
    );
  }

  private hasChildren(node: any): boolean {
    if (!node || typeof node !== 'object') return false;
    return !!(node.body || node.children || node.elements || node.properties);
  }

  private getNodeDepth(node: any): number {
    if (!node || typeof node !== 'object') return 0;

    let maxDepth = 0;
    const traverse = (obj: any, depth: number) => {
      if (depth > maxDepth) maxDepth = depth;
      if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
            traverse(obj[key], depth + 1);
          }
        }
      }
    };

    traverse(node, 0);
    return maxDepth;
  }

  private getNodeComplexity(node: any): number {
    if (!node || typeof node !== 'object') return 0;

    let complexity = 0;
    const traverse = (obj: any) => {
      if (obj && typeof obj === 'object') {
        complexity++;
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            traverse(obj[key]);
          }
        }
      }
    };

    traverse(node);
    return complexity;
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  private shouldBreak(phase: string, nodeType: string): boolean {
    if (this.stepMode) return true;

    return (
      this.activeBreakpoints.has(phase) ||
      this.activeBreakpoints.has(nodeType) ||
      this.activeBreakpoints.has(`${phase}:${nodeType}`)
    );
  }

  private handleBreakpoint(
    phase: string,
    nodeType: string,
    debugInfo: ITransformerDebugInfo
  ): void {
    console.group(`[TRANSFORMER-BREAKPOINT] ${phase} -> ${nodeType}`);
    console.log('Debug Info:', debugInfo);
    console.log('Available commands: continue, step, inspect, dump');
    console.groupEnd();

    // In a real implementation, this would pause execution
    // For now, just log the breakpoint
  }

  private getASTDiff(original: any, transformed: any): string[] {
    const changes: string[] = [];

    // Simple diff - check if types changed
    if (original?.type !== transformed?.type) {
      changes.push(`Type changed: ${original?.type} -> ${transformed?.type}`);
    }

    // Check if new properties added
    if (transformed && original) {
      for (const key in transformed) {
        if (!(key in original)) {
          changes.push(`Added property: ${key}`);
        }
      }
    }

    return changes;
  }
}

/**
 * Global transformer debugger instance
 */
let globalTransformerDebugger: TransformerDebugger | null = null;

export function getTransformerDebugger(): TransformerDebugger {
  if (!globalTransformerDebugger) {
    // Check for debug environment variables
    const config = {
      enabled: process?.env?.PULSAR_TRANSFORMER_DEBUG === '1',
      verboseLogging: process?.env?.PULSAR_TRANSFORMER_VERBOSE === '1',
      astDumping: process?.env?.PULSAR_TRANSFORMER_AST_DUMP === '1',
      outputPath: process?.env?.PULSAR_TRANSFORMER_DEBUG_PATH || './transformer-debug',
    };

    globalTransformerDebugger = new TransformerDebugger(config);
  }
  return globalTransformerDebugger;
}

export function initializeTransformerDebugger(
  config: Partial<ITransformerDebugConfig>
): TransformerDebugger {
  globalTransformerDebugger = new TransformerDebugger(config);
  return globalTransformerDebugger;
}

export function clearTransformerDebugger(): void {
  globalTransformerDebugger = null;
}
