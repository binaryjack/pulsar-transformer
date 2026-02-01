/**
 * Transform tracking and debugging infrastructure
 * Complete implementation with performance monitoring
 */

import * as ts from 'typescript';
import {
  IDebugOptions,
  ITransformSession,
  ITransformStep,
  ITransformTracker,
  TransformPhase,
} from '../types.js';

/**
 * Create transform tracker instance
 */
export function createTransformTracker(options: IDebugOptions): ITransformTracker {
  const sessions = new Map<string, ITransformSession>();
  let currentSession: string | null = null;
  let stepCounter = 0;
  let startMemory = 0;

  const tracker: ITransformTracker = {
    currentSession: undefined,
    options: {
      enabled: options.enabled,
      verbose:
        options.channels.transform || options.channels.detector || options.channels.generator,
      output: {
        console: options.output.console,
        file: options.output.file || undefined,
        format:
          options.output.format === 'text'
            ? 'json'
            : (options.output.format as 'json' | 'markdown'),
      },
    },
    startSession(fileName: string, sourceFile: ts.SourceFile): string {
      const sessionId = `${fileName}:${Date.now()}`;
      tracker.currentSession = sessionId;
      startMemory = process.memoryUsage().heapUsed;

      const session: ITransformSession = {
        sessionId,
        fileName,
        startTime: Date.now(),
        steps: [],
        summary: {
          totalSteps: 0,
          totalDuration: 0,
          errorsCount: 0,
          warningsCount: 0,
          componentsTransformed: 0,
          wiresGenerated: 0,
          eventsAttached: 0,
          averageStepTime: 0,
          peakMemory: 0,
        },
        ast: {
          before: serializeAST(sourceFile),
          after: '',
          diff: '',
        },
      };

      sessions.set(sessionId, session);
      currentSession = sessionId;
      stepCounter = 0;

      if (options.enabled && options.channels.transform) {
        console.log(`\n━━━ PULSAR TRANSFORMER SESSION START ━━━`);
        console.log(`File: ${fileName}`);
        console.log(`Session: ${sessionId}`);
        console.log(`Time: ${new Date().toISOString()}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      }

      return sessionId;
    },

    trackStep(stepData): ITransformStep {
      if (!currentSession) {
        throw new Error('No active session. Call startSession() first.');
      }

      const session = sessions.get(currentSession);
      if (!session) {
        throw new Error(`Session not found: ${currentSession}`);
      }

      const startTime = performance.now();
      const startMem = process.memoryUsage().heapUsed;

      stepCounter++;
      const step: ITransformStep = {
        ...stepData,
        id: `step-${stepCounter}`,
        timestamp: Date.now(),
        duration: 0,
        performance: options.performance.enabled
          ? {
              duration: 0,
              memoryDelta: 0,
              gcTime: 0,
              nodeCount: stepData.output.astNodes.length,
            }
          : undefined,
      };

      // Calculate performance metrics
      if (options.performance.enabled) {
        const endTime = performance.now();
        const endMem = process.memoryUsage().heapUsed;

        step.duration = endTime - startTime;
        if (step.performance) {
          step.performance.duration = step.duration;
          step.performance.memoryDelta = endMem - startMem;
        }

        // Update peak memory
        if (endMem > session.summary.peakMemory) {
          session.summary.peakMemory = endMem;
        }

        // Warn on slow steps
        if (step.duration > options.performance.threshold) {
          console.warn(
            `⚠️  SLOW STEP: ${step.phase} took ${step.duration.toFixed(2)}ms ` +
              `(threshold: ${options.performance.threshold}ms)`
          );
        }
      }

      session.steps.push(step);
      session.summary.totalSteps++;

      if (stepData.error) {
        session.summary.errorsCount++;
      }

      // Update counters based on step type
      if (step.classification?.requiresWire) {
        session.summary.wiresGenerated++;
      }
      if (step.phase === 'wrap') {
        session.summary.componentsTransformed++;
      }

      logStep(step, session, options);

      return step;
    },

    endSession(): ITransformSession {
      if (!currentSession) {
        throw new Error('No active session to end.');
      }

      const session = sessions.get(currentSession);
      if (!session) {
        throw new Error(`Session not found: ${currentSession}`);
      }

      session.endTime = Date.now();
      session.summary.totalDuration = session.endTime - session.startTime;

      if (session.summary.totalSteps > 0) {
        session.summary.averageStepTime =
          session.summary.totalDuration / session.summary.totalSteps;
      }

      if (options.enabled && options.channels.transform) {
        console.log(`\n━━━ PULSAR TRANSFORMER SESSION END ━━━`);
        console.log(`Duration: ${session.summary.totalDuration}ms`);
        console.log(`Steps: ${session.summary.totalSteps}`);
        console.log(`Components: ${session.summary.componentsTransformed}`);
        console.log(`Wires: ${session.summary.wiresGenerated}`);
        console.log(`Events: ${session.summary.eventsAttached}`);
        console.log(`Errors: ${session.summary.errorsCount}`);
        console.log(`Avg Step Time: ${session.summary.averageStepTime.toFixed(2)}ms`);
        console.log(`Peak Memory: ${(session.summary.peakMemory / 1024 / 1024).toFixed(2)}MB`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      }

      currentSession = null;
      return session;
    },

    getSession(sessionId: string): ITransformSession | undefined {
      return sessions.get(sessionId);
    },

    getAllSessions(): ITransformSession[] {
      return Array.from(sessions.values());
    },

    exportSession(sessionId: string, format: 'json' | 'html' | 'text'): string {
      const session = sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      switch (format) {
        case 'json':
          return JSON.stringify(session, null, 2);

        case 'html':
          return generateHTMLReport(session);

        case 'text':
          return generateTextReport(session);

        default:
          throw new Error(`Unknown format: ${format}`);
      }
    },
  };

  return tracker;
}

/**
 * Log individual transform step
 */
function logStep(step: ITransformStep, session: ITransformSession, options: IDebugOptions): void {
  if (!options.enabled) return;

  const phaseChannel = getPhaseChannel(step.phase, options);
  if (!phaseChannel) return;

  const depth = getStepDepth(step, session);
  const indent = '  '.repeat(depth);
  const icon = getPhaseIcon(step.phase);
  const color = step.error ? '\x1b[31m' : '\x1b[32m';
  const reset = '\x1b[0m';

  if (options.output.console) {
    console.log(
      `${indent}${icon} ${color}[${step.phase.toUpperCase()}]${reset} ` +
        `${step.input.nodeType} @ L${step.input.position.line}:${step.input.position.column}`
    );

    if (step.classification) {
      console.log(`${indent}  ⮕ ${step.classification.type} via ${step.classification.strategy}`);
      console.log(`${indent}  ℹ ${step.classification.reason}`);
    }

    if (step.error) {
      console.error(`${indent}  ✗ ERROR: ${step.error.message}`);
      console.error(`${indent}    Code: ${step.error.code}`);
    } else if (step.output.code) {
      const preview = step.output.code.substring(0, 60).replace(/\n/g, ' ');
      console.log(`${indent}  ✓ ${preview}${step.output.code.length > 60 ? '...' : ''}`);
    }

    if (step.performance && options.performance.enabled) {
      console.log(
        `${indent}  ⏱ ${step.performance.duration.toFixed(2)}ms ` +
          `(${step.performance.nodeCount} nodes)`
      );
    }
  }
}

/**
 * Get step depth in transformation tree
 */
function getStepDepth(step: ITransformStep, session: ITransformSession): number {
  if (!step.context.parentStep) return 0;

  let depth = 0;
  let currentParent: string | undefined = step.context.parentStep;

  while (currentParent) {
    depth++;
    const parentStep = session.steps.find((s) => s.id === currentParent);
    if (!parentStep) break;
    currentParent = parentStep.context.parentStep;
  }

  return depth;
}

/**
 * Get appropriate channel for phase
 */
function getPhaseChannel(phase: TransformPhase, options: IDebugOptions): boolean {
  switch (phase) {
    case 'detect':
      return options.channels.detector;
    case 'generate':
      return options.channels.generator;
    case 'visit':
      return options.channels.visitor;
    case 'wire':
      return options.channels.wire;
    case 'wrap':
      return options.channels.transform;
    case 'validate':
      return options.channels.transform;
    default:
      return false;
  }
}

/**
 * Get icon for phase
 */
function getPhaseIcon(phase: TransformPhase): string {
  switch (phase) {
    case 'detect':
      return '🔍';
    case 'generate':
      return '⚙️';
    case 'visit':
      return '🚶';
    case 'wire':
      return '🔌';
    case 'wrap':
      return '📦';
    case 'validate':
      return '✔️';
    default:
      return '•';
  }
}

/**
 * Serialize AST for snapshots
 */
function serializeAST(node: ts.Node): string {
  const result: string[] = [];

  function visit(n: ts.Node, depth: number): void {
    const indent = '  '.repeat(depth);
    result.push(`${indent}${ts.SyntaxKind[n.kind]}`);
    ts.forEachChild(n, (child) => visit(child, depth + 1));
  }

  visit(node, 0);
  return result.join('\n');
}

/**
 * Generate HTML report for session
 */
function generateHTMLReport(session: ITransformSession): string {
  // TODO: Implement full HTML report with charts
  return `<!DOCTYPE html>
<html>
<head>
  <title>Transform Session: ${session.fileName}</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    .summary { background: #f0f0f0; padding: 10px; margin-bottom: 20px; }
    .step { margin: 10px 0; padding: 10px; border-left: 3px solid #ccc; }
    .error { border-color: red; background: #ffe0e0; }
  </style>
</head>
<body>
  <h1>Transform Session Report</h1>
  <div class="summary">
    <p>File: ${session.fileName}</p>
    <p>Duration: ${session.summary.totalDuration}ms</p>
    <p>Steps: ${session.summary.totalSteps}</p>
    <p>Components: ${session.summary.componentsTransformed}</p>
    <p>Wires: ${session.summary.wiresGenerated}</p>
  </div>
  ${session.steps
    .map(
      (step) => `
    <div class="step ${step.error ? 'error' : ''}">
      <strong>${step.phase}: ${step.input.nodeType}</strong><br>
      ${step.classification ? `Type: ${step.classification.type}<br>` : ''}
      ${step.error ? `<span style="color:red">Error: ${step.error.message}</span>` : ''}
    </div>
  `
    )
    .join('')}
</body>
</html>`;
}

/**
 * Generate text report for session
 */
function generateTextReport(session: ITransformSession): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════');
  lines.push('PULSAR TRANSFORMER SESSION REPORT');
  lines.push('═══════════════════════════════════════');
  lines.push(`File: ${session.fileName}`);
  lines.push(`Session: ${session.sessionId}`);
  lines.push(`Duration: ${session.summary.totalDuration}ms`);
  lines.push(`Steps: ${session.summary.totalSteps}`);
  lines.push(`Components: ${session.summary.componentsTransformed}`);
  lines.push(`Wires: ${session.summary.wiresGenerated}`);
  lines.push(`Errors: ${session.summary.errorsCount}`);
  lines.push('');

  session.steps.forEach((step) => {
    lines.push(`─── ${step.id} ───`);
    lines.push(`Phase: ${step.phase}`);
    lines.push(`Node: ${step.input.nodeType}`);
    lines.push(`Position: L${step.input.position.line}:${step.input.position.column}`);

    if (step.classification) {
      lines.push(`Classification: ${step.classification.type}`);
      lines.push(`Strategy: ${step.classification.strategy}`);
    }

    if (step.error) {
      lines.push(`ERROR: ${step.error.message}`);
    }

    lines.push('');
  });

  return lines.join('\n');
}
