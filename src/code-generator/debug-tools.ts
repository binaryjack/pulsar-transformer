/**
 * Code Generator Debug Tools - Enterprise debugging and introspection
 * Provides detailed debugging capabilities for code generation issues
 */

import { DiagnosticCode, DiagnosticSeverity, CodeGeneratorDiagnostic } from './diagnostics.js';
import { ICodeGenerationState } from './state-tracker.js';

export interface IDebugSnapshot {
  timestamp: number;
  phase: string;
  nodeType: string;
  nodeDetails: any;
  generationState: ICodeGenerationState;
  outputSample: string;
  stackTrace: string;
  memoryUsage: number;
  performanceMetrics: {
    generationTime: number;
    nodesProcessed: number;
    outputLength: number;
  };
}

export interface ICodeGeneratorDebugTools {
  captureSnapshot(node: any, state: ICodeGenerationState, output: string): IDebugSnapshot;
  formatNodeForDebug(node: any): string;
  traceGenerationPath(node: any): string[];
  analyzePerformanceBottleneck(snapshots: IDebugSnapshot[]): PerformanceAnalysis;
  generateDebugReport(diagnostics: CodeGeneratorDiagnostic[], snapshots: IDebugSnapshot[]): string;
  extractRelevantNodeInfo(node: any): any;
  compareSnapshots(before: IDebugSnapshot, after: IDebugSnapshot): SnapshotComparison;
  detectAnomalies(snapshots: IDebugSnapshot[]): AnomalyReport[];
  suggestFixes(diagnostic: CodeGeneratorDiagnostic, context: IDebugSnapshot): string[];
  enableVerboseLogging(): void;
  disableVerboseLogging(): void;
  isVerboseLogging(): boolean;
}

export interface PerformanceAnalysis {
  slowestPhase: string;
  averageGenerationTime: number;
  memoryGrowth: number;
  bottleneckNodes: Array<{
    nodeType: string;
    averageTime: number;
    count: number;
  }>;
  recommendations: string[];
}

export interface SnapshotComparison {
  memoryDelta: number;
  timeDelta: number;
  outputLengthDelta: number;
  phaseChanged: boolean;
  nodeChanged: boolean;
  significantChanges: string[];
}

export interface AnomalyReport {
  type: 'memory-spike' | 'slow-generation' | 'output-corruption' | 'state-inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedSnapshots: number[];
  suggestedAction: string;
}

/**
 * Code Generator Debug Tools Implementation
 */
export const CodeGeneratorDebugTools = function (this: ICodeGeneratorDebugTools & { verboseLogging: boolean; snapshots: IDebugSnapshot[] }) {
  this.verboseLogging = false;
  this.snapshots = [];
} as unknown as { new (): ICodeGeneratorDebugTools };

CodeGeneratorDebugTools.prototype.captureSnapshot = function (
  this: ICodeGeneratorDebugTools & { snapshots: IDebugSnapshot[]; verboseLogging: boolean },
  node: any,
  state: ICodeGenerationState,
  output: string
): IDebugSnapshot {
  const snapshot: IDebugSnapshot = {
    timestamp: Date.now(),
    phase: state.phase,
    nodeType: node?.type || 'unknown',
    nodeDetails: this.extractRelevantNodeInfo(node),
    generationState: { ...state },
    outputSample: output.slice(-200), // Last 200 chars of output
    stackTrace: new Error().stack || '',
    memoryUsage: process.memoryUsage().heapUsed,
    performanceMetrics: {
      generationTime: Date.now() - state.generationStartTime,
      nodesProcessed: state.performanceMetrics.totalNodes,
      outputLength: output.length,
    },
  };

  this.snapshots.push(snapshot);

  if (this.verboseLogging) {
    console.log(`[CG-DEBUG] Snapshot captured: ${snapshot.phase} - ${snapshot.nodeType}`);
    console.log(`  Memory: ${(snapshot.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Time: ${snapshot.performanceMetrics.generationTime}ms`);
    console.log(`  Nodes: ${snapshot.performanceMetrics.nodesProcessed}`);
  }

  return snapshot;
};

CodeGeneratorDebugTools.prototype.formatNodeForDebug = function (
  this: ICodeGeneratorDebugTools,
  node: any
): string {
  if (!node) return 'null';

  const nodeInfo = {
    type: node.type,
    ...(node.name && { name: node.name.name || node.name }),
    ...(node.kind && { kind: node.kind }),
    ...(node.operator && { operator: node.operator }),
    ...(node.params && { paramCount: node.params.length }),
    ...(node.body && { hasBody: true }),
    ...(node.children && { childrenCount: node.children.length }),
    ...(node.properties && { propertiesCount: node.properties.length }),
  };

  return JSON.stringify(nodeInfo, null, 2);
};

CodeGeneratorDebugTools.prototype.traceGenerationPath = function (
  this: ICodeGeneratorDebugTools & { snapshots: IDebugSnapshot[] },
  node: any
): string[] {
  const targetNodeType = node?.type;
  const relevantSnapshots = this.snapshots.filter((s) => s.nodeType === targetNodeType);

  return relevantSnapshots.map(
    (s) => `${s.phase} -> ${s.nodeType} (${s.performanceMetrics.generationTime}ms)`
  );
};

CodeGeneratorDebugTools.prototype.analyzePerformanceBottleneck = function (
  this: ICodeGeneratorDebugTools,
  snapshots: IDebugSnapshot[]
): PerformanceAnalysis {
  // Group by phase
  const phaseMetrics = new Map<string, number[]>();
  snapshots.forEach((s) => {
    if (!phaseMetrics.has(s.phase)) {
      phaseMetrics.set(s.phase, []);
    }
    phaseMetrics.get(s.phase)!.push(s.performanceMetrics.generationTime);
  });

  // Find slowest phase
  let slowestPhase = '';
  let slowestAverage = 0;
  phaseMetrics.forEach((times, phase) => {
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    if (average > slowestAverage) {
      slowestAverage = average;
      slowestPhase = phase;
    }
  });

  // Analyze node types
  const nodeMetrics = new Map<string, { times: number[]; count: number }>();
  snapshots.forEach((s) => {
    if (!nodeMetrics.has(s.nodeType)) {
      nodeMetrics.set(s.nodeType, { times: [], count: 0 });
    }
    const metrics = nodeMetrics.get(s.nodeType)!;
    metrics.times.push(s.performanceMetrics.generationTime);
    metrics.count++;
  });

  const bottleneckNodes = Array.from(nodeMetrics.entries())
    .map(([nodeType, data]) => ({
      nodeType,
      averageTime: data.times.reduce((a, b) => a + b, 0) / data.times.length,
      count: data.count,
    }))
    .sort((a, b) => b.averageTime - a.averageTime)
    .slice(0, 5);

  const totalTime = snapshots.reduce((sum, s) => sum + s.performanceMetrics.generationTime, 0);
  const averageGenerationTime = totalTime / snapshots.length;

  const memoryUsages = snapshots.map((s) => s.memoryUsage);
  const memoryGrowth = Math.max(...memoryUsages) - Math.min(...memoryUsages);

  const recommendations = [];
  if (slowestAverage > 50) {
    recommendations.push(`Optimize ${slowestPhase} phase (${slowestAverage.toFixed(0)}ms average)`);
  }
  if (memoryGrowth > 50 * 1024 * 1024) {
    recommendations.push(
      `High memory growth detected (${(memoryGrowth / 1024 / 1024).toFixed(1)}MB)`
    );
  }
  if (bottleneckNodes.length > 0 && bottleneckNodes[0].averageTime > 20) {
    recommendations.push(
      `Optimize ${bottleneckNodes[0].nodeType} generation (${bottleneckNodes[0].averageTime.toFixed(0)}ms average)`
    );
  }

  return {
    slowestPhase,
    averageGenerationTime,
    memoryGrowth,
    bottleneckNodes,
    recommendations,
  };
};

CodeGeneratorDebugTools.prototype.generateDebugReport = function (
  this: ICodeGeneratorDebugTools,
  diagnostics: CodeGeneratorDiagnostic[],
  snapshots: IDebugSnapshot[]
): string {
  const report = [];

  report.push('=== Code Generator Debug Report ===');
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push('');

  // Diagnostic Summary
  report.push('--- Diagnostics Summary ---');
  const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
  const warnings = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Warning);
  const info = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Info);

  report.push(`Total Diagnostics: ${diagnostics.length}`);
  report.push(`  Errors: ${errors.length}`);
  report.push(`  Warnings: ${warnings.length}`);
  report.push(`  Info: ${info.length}`);
  report.push('');

  // Critical Issues
  if (errors.length > 0) {
    report.push('--- Critical Issues ---');
    errors.slice(0, 5).forEach((error) => {
      report.push(`[${error.code}] ${error.message}`);
      if (error.suggestion) {
        report.push(`  Suggestion: ${error.suggestion}`);
      }
    });
    report.push('');
  }

  // Performance Analysis
  if (snapshots.length > 0) {
    const perfAnalysis = this.analyzePerformanceBottleneck(snapshots);
    report.push('--- Performance Analysis ---');
    report.push(`Average Generation Time: ${perfAnalysis.averageGenerationTime.toFixed(2)}ms`);
    report.push(`Slowest Phase: ${perfAnalysis.slowestPhase}`);
    report.push(`Memory Growth: ${(perfAnalysis.memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    report.push('');

    if (perfAnalysis.bottleneckNodes.length > 0) {
      report.push('Top Performance Bottlenecks:');
      perfAnalysis.bottleneckNodes.forEach((node, i) => {
        report.push(
          `  ${i + 1}. ${node.nodeType}: ${node.averageTime.toFixed(1)}ms avg (${node.count} nodes)`
        );
      });
      report.push('');
    }

    if (perfAnalysis.recommendations.length > 0) {
      report.push('Recommendations:');
      perfAnalysis.recommendations.forEach((rec) => {
        report.push(`  • ${rec}`);
      });
      report.push('');
    }
  }

  // Anomaly Detection
  const anomalies = this.detectAnomalies(snapshots);
  if (anomalies.length > 0) {
    report.push('--- Anomalies Detected ---');
    anomalies.forEach((anomaly) => {
      report.push(`[${anomaly.severity.toUpperCase()}] ${anomaly.type}: ${anomaly.description}`);
      report.push(`  Action: ${anomaly.suggestedAction}`);
    });
    report.push('');
  }

  return report.join('\n');
};

CodeGeneratorDebugTools.prototype.extractRelevantNodeInfo = function (
  this: ICodeGeneratorDebugTools,
  node: any
): any {
  if (!node) return null;

  return {
    type: node.type,
    name: node.name?.name,
    kind: node.kind,
    operator: node.operator,
    hasParams: Boolean(node.params),
    hasBody: Boolean(node.body),
    hasChildren: Boolean(node.children),
    hasProperties: Boolean(node.properties),
    location: node.loc
      ? {
          start: node.loc.start,
          end: node.loc.end,
        }
      : null,
  };
};

CodeGeneratorDebugTools.prototype.compareSnapshots = function (
  this: ICodeGeneratorDebugTools,
  before: IDebugSnapshot,
  after: IDebugSnapshot
): SnapshotComparison {
  return {
    memoryDelta: after.memoryUsage - before.memoryUsage,
    timeDelta: after.performanceMetrics.generationTime - before.performanceMetrics.generationTime,
    outputLengthDelta:
      after.performanceMetrics.outputLength - before.performanceMetrics.outputLength,
    phaseChanged: before.phase !== after.phase,
    nodeChanged: before.nodeType !== after.nodeType,
    significantChanges: [
      ...(Math.abs(after.memoryUsage - before.memoryUsage) > 1024 * 1024 ? ['Memory change'] : []),
      ...(after.performanceMetrics.generationTime - before.performanceMetrics.generationTime > 10
        ? ['Time increase']
        : []),
      ...(before.phase !== after.phase ? [`Phase: ${before.phase} -> ${after.phase}`] : []),
      ...(before.nodeType !== after.nodeType
        ? [`Node: ${before.nodeType} -> ${after.nodeType}`]
        : []),
    ],
  };
};

CodeGeneratorDebugTools.prototype.detectAnomalies = function (
  this: ICodeGeneratorDebugTools,
  snapshots: IDebugSnapshot[]
): AnomalyReport[] {
  const anomalies: AnomalyReport[] = [];

  // Memory spike detection
  for (let i = 1; i < snapshots.length; i++) {
    const memoryGrowth = snapshots[i].memoryUsage - snapshots[i - 1].memoryUsage;
    if (memoryGrowth > 10 * 1024 * 1024) {
      // 10MB spike
      anomalies.push({
        type: 'memory-spike',
        severity: 'high',
        description: `Memory spike of ${(memoryGrowth / 1024 / 1024).toFixed(1)}MB detected`,
        affectedSnapshots: [i - 1, i],
        suggestedAction: 'Investigate potential memory leak or inefficient object creation',
      });
    }
  }

  // Slow generation detection
  snapshots.forEach((snapshot, index) => {
    if (snapshot.performanceMetrics.generationTime > 100) {
      anomalies.push({
        type: 'slow-generation',
        severity: snapshot.performanceMetrics.generationTime > 500 ? 'critical' : 'medium',
        description: `Slow generation detected: ${snapshot.performanceMetrics.generationTime}ms for ${snapshot.nodeType}`,
        affectedSnapshots: [index],
        suggestedAction: 'Optimize generation logic for this node type',
      });
    }
  });

  // Output corruption detection (rapid output length changes)
  for (let i = 1; i < snapshots.length; i++) {
    const outputChange =
      snapshots[i].performanceMetrics.outputLength -
      snapshots[i - 1].performanceMetrics.outputLength;
    if (outputChange < -100) {
      // Output shrinking (potential corruption)
      anomalies.push({
        type: 'output-corruption',
        severity: 'high',
        description: `Output length decreased by ${Math.abs(outputChange)} characters`,
        affectedSnapshots: [i - 1, i],
        suggestedAction: 'Check for generation errors or output overwrites',
      });
    }
  }

  return anomalies;
};

CodeGeneratorDebugTools.prototype.suggestFixes = function (
  this: ICodeGeneratorDebugTools,
  diagnostic: CodeGeneratorDiagnostic,
  context: IDebugSnapshot
): string[] {
  const fixes: string[] = [];

  switch (diagnostic.code) {
    case DiagnosticCode.InterfaceJSDocGeneration:
      fixes.push('Replace JSDoc generation with proper TypeScript interface syntax');
      fixes.push('Use "interface Name { ... }" instead of "/** @interface */"');
      fixes.push('Check generateInterfaceDeclaration method implementation');
      break;

    case DiagnosticCode.ComponentReturnTypeMissing:
      fixes.push('Add ":HTMLElement" return type annotation to component function');
      fixes.push('Update component signature: function Component(): HTMLElement');
      fixes.push('Ensure TypeScript output includes return types');
      break;

    case DiagnosticCode.SlowGenerationPerformance:
      fixes.push('Profile generation code to identify bottlenecks');
      fixes.push('Consider caching repeated calculations');
      fixes.push('Optimize AST traversal algorithms');
      break;

    case DiagnosticCode.MemoryUsageHigh:
      fixes.push('Implement object pooling for frequently created objects');
      fixes.push('Clear unnecessary references after use');
      fixes.push('Consider streaming output for large files');
      break;

    default:
      if (diagnostic.suggestion) {
        fixes.push(diagnostic.suggestion);
      }
      fixes.push('Review code generation logic for this node type');
      fixes.push('Check for proper error handling and recovery');
  }

  return fixes;
};

CodeGeneratorDebugTools.prototype.enableVerboseLogging = function (
  this: ICodeGeneratorDebugTools & { verboseLogging: boolean }
) {
  this.verboseLogging = true;
  console.log('[CG-DEBUG] Verbose logging enabled');
};

CodeGeneratorDebugTools.prototype.disableVerboseLogging = function (
  this: ICodeGeneratorDebugTools & { verboseLogging: boolean }
) {
  this.verboseLogging = false;
  console.log('[CG-DEBUG] Verbose logging disabled');
};

CodeGeneratorDebugTools.prototype.isVerboseLogging = function (
  this: ICodeGeneratorDebugTools & { verboseLogging: boolean }
) {
  return this.verboseLogging;
};

/**
 * Create debug tools instance
 */
export function createCodeGeneratorDebugTools(): ICodeGeneratorDebugTools {
  return new CodeGeneratorDebugTools();
}

/**
 * Debug utilities
 */
export const DebugUtils = {
  /**
   * Format bytes as human readable
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format duration as human readable
   */
  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  },

  /**
   * Truncate string with ellipsis
   */
  truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length - 3) + '...';
  },
};
