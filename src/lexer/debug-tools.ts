/**
 * Lexer Debug Tools and Snapshots
 * Advanced debugging utilities for lexer state inspection
 */

import type { ILexer, IToken } from './lexer.types.js';
import { LexerStateEnum } from './lexer.types.js';
import type { StateTransition } from './state-tracker.js';

export interface LexerSnapshot {
  timestamp: number;
  position: number;
  line: number;
  column: number;
  state: LexerStateEnum;
  stateStack: LexerStateEnum[];
  depths: {
    jsx: number;
    template: number;
    expression: number;
    parentheses: number;
  };
  tokenHistory: IToken[];
  contextWindow: {
    before: string;
    current: string;
    after: string;
  };
  flags: {
    justExitedJSXTextForBrace: boolean;
  };
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  totalTokens: number;
  tokensPerSecond?: number;
  averageTokenTime?: number;
  slowestTokens: Array<{
    type: string;
    value: string;
    time: number;
    position: number;
  }>;
  peakDepths: {
    jsx: number;
    template: number;
    expression: number;
  };
  stateTransitions: number;
  errorCount: number;
  warningCount: number;
}

export class LexerDebugger {
  private snapshots: Map<string, LexerSnapshot> = new Map();
  private performanceData: PerformanceMetrics;
  private tokenTimes: Map<number, number> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.performanceData = {
      startTime: 0,
      totalTokens: 0,
      slowestTokens: [],
      peakDepths: { jsx: 0, template: 0, expression: 0 },
      stateTransitions: 0,
      errorCount: 0,
      warningCount: 0,
    };
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  startTiming(): void {
    if (!this.enabled) return;
    this.performanceData.startTime = performance.now();
  }

  endTiming(): void {
    if (!this.enabled) return;
    this.performanceData.endTime = performance.now();

    const duration = this.performanceData.endTime - this.performanceData.startTime;
    if (this.performanceData.totalTokens > 0) {
      this.performanceData.tokensPerSecond = (this.performanceData.totalTokens / duration) * 1000;
      this.performanceData.averageTokenTime = duration / this.performanceData.totalTokens;
    }
  }

  recordTokenTiming(tokenIndex: number, startTime: number): void {
    if (!this.enabled) return;
    const duration = performance.now() - startTime;
    this.tokenTimes.set(tokenIndex, duration);
  }

  recordSlowToken(type: string, value: string, time: number, position: number): void {
    if (!this.enabled) return;

    this.performanceData.slowestTokens.push({ type, value, time, position });

    // Keep only top 10 slowest
    this.performanceData.slowestTokens.sort((a, b) => b.time - a.time);
    if (this.performanceData.slowestTokens.length > 10) {
      this.performanceData.slowestTokens = this.performanceData.slowestTokens.slice(0, 10);
    }
  }

  updatePeakDepths(jsx: number, template: number, expression: number): void {
    if (!this.enabled) return;

    this.performanceData.peakDepths.jsx = Math.max(this.performanceData.peakDepths.jsx, jsx);
    this.performanceData.peakDepths.template = Math.max(
      this.performanceData.peakDepths.template,
      template
    );
    this.performanceData.peakDepths.expression = Math.max(
      this.performanceData.peakDepths.expression,
      expression
    );
  }

  /**
   * Capture current lexer state
   */
  captureSnapshot(lexer: ILexer, label: string = 'default'): LexerSnapshot {
    if (!this.enabled) {
      return {} as LexerSnapshot; // Return empty snapshot when disabled
    }

    const contextRadius = 20;
    const beforeStart = Math.max(0, lexer.pos - contextRadius);
    const afterEnd = Math.min(lexer.source.length, lexer.pos + contextRadius);

    const snapshot: LexerSnapshot = {
      timestamp: Date.now(),
      position: lexer.pos,
      line: lexer.line,
      column: lexer.column,
      state: lexer.getState(),
      stateStack: [...lexer.stateStack],
      depths: {
        jsx: lexer.jsxDepth,
        template: lexer.templateDepth,
        expression: lexer.expressionDepth,
        parentheses: lexer.parenthesesDepth,
      },
      tokenHistory: lexer.tokens.slice(-10), // Last 10 tokens
      contextWindow: {
        before: lexer.source.slice(beforeStart, lexer.pos),
        current: lexer.pos < lexer.source.length ? lexer.source[lexer.pos] : '',
        after: lexer.source.slice(lexer.pos + 1, afterEnd),
      },
      flags: {
        justExitedJSXTextForBrace: lexer.justExitedJSXTextForBrace,
      },
    };

    this.snapshots.set(label, snapshot);
    return snapshot;
  }

  /**
   * Get stored snapshot
   */
  getSnapshot(label: string): LexerSnapshot | undefined {
    return this.snapshots.get(label);
  }

  /**
   * Compare two snapshots
   */
  compareSnapshots(before: LexerSnapshot, after: LexerSnapshot): string[] {
    const changes: string[] = [];

    if (before.position !== after.position) {
      changes.push(
        `Position: ${before.position} → ${after.position} (+${after.position - before.position})`
      );
    }

    if (before.line !== after.line) {
      changes.push(`Line: ${before.line} → ${after.line}`);
    }

    if (before.column !== after.column) {
      changes.push(`Column: ${before.column} → ${after.column}`);
    }

    if (before.state !== after.state) {
      changes.push(`State: ${before.state} → ${after.state}`);
    }

    if (before.stateStack.length !== after.stateStack.length) {
      changes.push(`State Stack Depth: ${before.stateStack.length} → ${after.stateStack.length}`);
    }

    Object.keys(before.depths).forEach((key) => {
      const k = key as keyof typeof before.depths;
      if (before.depths[k] !== after.depths[k]) {
        changes.push(`${key} Depth: ${before.depths[k]} → ${after.depths[k]}`);
      }
    });

    const tokenDiff = after.tokenHistory.length - before.tokenHistory.length;
    if (tokenDiff !== 0) {
      changes.push(`Tokens: ${tokenDiff > 0 ? `+${tokenDiff}` : tokenDiff} new tokens`);

      // Show new tokens
      if (tokenDiff > 0) {
        const newTokens = after.tokenHistory.slice(-tokenDiff);
        changes.push(`New Tokens: ${newTokens.map((t) => `${t.type}:"${t.value}"`).join(', ')}`);
      }
    }

    return changes;
  }

  /**
   * Print formatted snapshot
   */
  printSnapshot(snapshot: LexerSnapshot, label?: string): void {
    console.log(`\n📸 LEXER SNAPSHOT${label ? ` (${label})` : ''}:`);
    console.log(`   Position: ${snapshot.position} (${snapshot.line}:${snapshot.column})`);
    console.log(`   State: ${snapshot.state}`);

    if (snapshot.stateStack.length > 0) {
      console.log(`   State Stack: [${snapshot.stateStack.join(' → ')}]`);
    }

    console.log(
      `   Depths: jsx=${snapshot.depths.jsx}, template=${snapshot.depths.template}, expression=${snapshot.depths.expression}`
    );

    if (snapshot.flags.justExitedJSXTextForBrace) {
      console.log(`   Flags: justExitedJSXTextForBrace=true`);
    }

    console.log(
      `   Context: ...${snapshot.contextWindow.before}[${snapshot.contextWindow.current}]${snapshot.contextWindow.after}...`
    );

    if (snapshot.tokenHistory.length > 0) {
      console.log(`   Last ${snapshot.tokenHistory.length} tokens:`);
      snapshot.tokenHistory.forEach((token, i) => {
        console.log(`     ${i}: ${token.type}: "${token.value}"`);
      });
    }
  }

  /**
   * Print comparison between snapshots
   */
  printComparison(beforeLabel: string, afterLabel: string): void {
    const before = this.snapshots.get(beforeLabel);
    const after = this.snapshots.get(afterLabel);

    if (!before || !after) {
      console.log(`❌ Cannot compare: missing snapshot(s)`);
      return;
    }

    const changes = this.compareSnapshots(before, after);

    console.log(`\n🔄 SNAPSHOT COMPARISON (${beforeLabel} → ${afterLabel}):`);

    if (changes.length === 0) {
      console.log(`   No changes detected`);
    } else {
      changes.forEach((change) => {
        console.log(`   ${change}`);
      });
    }
  }

  /**
   * Generate performance report
   */
  getPerformanceReport(): string {
    const lines: string[] = [
      '\n⚡ LEXER PERFORMANCE REPORT:',
      `   Total Time: ${this.performanceData.endTime ? (this.performanceData.endTime - this.performanceData.startTime).toFixed(2) : 'N/A'}ms`,
      `   Total Tokens: ${this.performanceData.totalTokens}`,
      `   Tokens/Second: ${this.performanceData.tokensPerSecond?.toFixed(0) || 'N/A'}`,
      `   Average Token Time: ${this.performanceData.averageTokenTime?.toFixed(3) || 'N/A'}ms`,
      `   Peak Depths: JSX=${this.performanceData.peakDepths.jsx}, Template=${this.performanceData.peakDepths.template}, Expression=${this.performanceData.peakDepths.expression}`,
      `   State Transitions: ${this.performanceData.stateTransitions}`,
      `   Errors: ${this.performanceData.errorCount}, Warnings: ${this.performanceData.warningCount}`,
    ];

    if (this.performanceData.slowestTokens.length > 0) {
      lines.push('\n   Slowest Tokens:');
      this.performanceData.slowestTokens.forEach((token, i) => {
        lines.push(
          `     ${i + 1}. ${token.type}:"${token.value}" (${token.time.toFixed(3)}ms at pos ${token.position})`
        );
      });
    }

    return lines.join('\n');
  }

  /**
   * Create debug session for step-by-step analysis
   */
  createDebugSession(lexer: ILexer): LexerDebugSession {
    return new LexerDebugSession(lexer, this);
  }

  clear(): void {
    this.snapshots.clear();
    this.tokenTimes.clear();
    this.performanceData = {
      startTime: 0,
      totalTokens: 0,
      slowestTokens: [],
      peakDepths: { jsx: 0, template: 0, expression: 0 },
      stateTransitions: 0,
      errorCount: 0,
      warningCount: 0,
    };
  }
}

/**
 * Interactive debug session for step-by-step lexer analysis
 */
export class LexerDebugSession {
  private lexer: ILexer;
  private debugTool: LexerDebugger;
  private stepCount: number = 0;
  private breakpoints: Set<number> = new Set();

  constructor(lexer: ILexer, debugTool: LexerDebugger) {
    this.lexer = lexer;
    this.debugTool = debugTool;
  }

  addBreakpoint(position: number): void {
    this.breakpoints.add(position);
  }

  removeBreakpoint(position: number): void {
    this.breakpoints.delete(position);
  }

  step(): boolean {
    const before = this.debugTool.captureSnapshot(this.lexer, `step-${this.stepCount}-before`);

    // Check breakpoint
    if (this.breakpoints.has(this.lexer.pos)) {
      console.log(`🛑 Breakpoint hit at position ${this.lexer.pos}`);
      this.debugTool.printSnapshot(before, `Breakpoint ${this.lexer.pos}`);
      return false; // Stop execution
    }

    try {
      if (this.lexer.isAtEnd()) {
        console.log('🏁 End of input reached');
        return false;
      }

      this.lexer.scanToken();

      const after = this.debugTool.captureSnapshot(this.lexer, `step-${this.stepCount}-after`);

      console.log(`\n🔄 Step ${this.stepCount}:`);
      this.debugTool.printComparison(
        `step-${this.stepCount}-before`,
        `step-${this.stepCount}-after`
      );

      this.stepCount++;
      return true;
    } catch (error) {
      console.log(`❌ Error at step ${this.stepCount}:`, error);
      return false;
    }
  }

  run(): void {
    console.log('🚀 Starting debug session...');

    while (this.step()) {
      // Continue until step() returns false
    }

    console.log(`🎯 Debug session completed after ${this.stepCount} steps`);
  }
}
