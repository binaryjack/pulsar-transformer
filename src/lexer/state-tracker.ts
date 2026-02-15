/**
 * State Transition Tracker
 * Tracks lexer state changes for debugging complex issues
 */

import { LexerStateEnum } from './lexer.types.js';

export interface StateTransition {
  from: LexerStateEnum;
  to: LexerStateEnum;
  trigger: string; // What caused the transition
  position: number;
  line: number;
  column: number;
  token?: string;
  timestamp: number;
  depth?: {
    jsx: number;
    template: number;
    expression: number;
    parentheses: number;
  };
}

export class StateTransitionTracker {
  private transitions: StateTransition[] = [];
  private maxHistory: number;
  private enabled: boolean = true;
  
  constructor(maxHistory: number = 200) {
    this.maxHistory = maxHistory;
  }
  
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  recordTransition(
    from: LexerStateEnum,
    to: LexerStateEnum,
    trigger: string,
    position: number,
    line: number,
    column: number,
    token?: string,
    depths?: {
      jsx?: number;
      template?: number;
      expression?: number;
      parentheses?: number;
    }
  ): void {
    if (!this.enabled) return;
    
    // Only record actual changes
    if (from === to) return;
    
    this.transitions.push({
      from,
      to,
      trigger,
      position,
      line,
      column,
      token,
      timestamp: Date.now(),
      depth: depths ? {
        jsx: depths.jsx || 0,
        template: depths.template || 0,
        expression: depths.expression || 0,
        parentheses: depths.parentheses || 0
      } : undefined
    });
    
    // Trim old history to prevent memory bloat
    if (this.transitions.length > this.maxHistory) {
      this.transitions.shift();
    }
  }
  
  getTransitions(): StateTransition[] {
    return [...this.transitions];
  }
  
  getLastTransition(): StateTransition | undefined {
    return this.transitions[this.transitions.length - 1];
  }
  
  getTransitionsForPosition(pos: number): StateTransition[] {
    return this.transitions.filter(t => t.position === pos);
  }
  
  getTransitionsInRange(startPos: number, endPos: number): StateTransition[] {
    return this.transitions.filter(t => t.position >= startPos && t.position <= endPos);
  }
  
  getStateAtPosition(pos: number): LexerStateEnum | undefined {
    // Find the last transition before or at this position
    const relevantTransitions = this.transitions.filter(t => t.position <= pos);
    if (relevantTransitions.length === 0) return LexerStateEnum.Normal;
    
    const lastTransition = relevantTransitions[relevantTransitions.length - 1];
    return lastTransition.to;
  }
  
  clear(): void {
    this.transitions = [];
  }
  
  /**
   * Print trace to console for debugging
   */
  printTrace(maxEntries?: number): void {
    const entries = maxEntries ? this.transitions.slice(-maxEntries) : this.transitions;
    
    console.log('\n🔍 STATE TRANSITION TRACE:');
    console.log(`   Total transitions: ${this.transitions.length}`);
    
    if (entries.length === 0) {
      console.log('   No transitions recorded');
      return;
    }
    
    entries.forEach((t, i) => {
      const depthInfo = t.depth 
        ? ` [jsx:${t.depth.jsx}, tpl:${t.depth.template}, exp:${t.depth.expression}]`
        : '';
      
      console.log(
        `   ${i + 1}: ${t.from} → ${t.to} | ${t.trigger} | ` +
        `pos=${t.position} (${t.line}:${t.column})${depthInfo}` +
        (t.token ? ` | token="${t.token}"` : '')
      );
    });
  }
  
  /**
   * Generate detailed trace for specific position
   */
  tracePosition(pos: number): string {
    const nearby = this.getTransitionsInRange(Math.max(0, pos - 50), pos + 50);
    
    if (nearby.length === 0) {
      return `No state transitions near position ${pos}`;
    }
    
    const lines: string[] = [
      `🎯 State transitions near position ${pos}:`
    ];
    
    nearby.forEach(t => {
      const marker = t.position === pos ? '👉' : '  ';
      const depthInfo = t.depth 
        ? ` [jsx:${t.depth.jsx}, tpl:${t.depth.template}]`
        : '';
      
      lines.push(
        `${marker} ${t.from} → ${t.to} | ${t.trigger} | ` +
        `pos=${t.position} (${t.line}:${t.column})${depthInfo}`
      );
    });
    
    return lines.join('\n');
  }
  
  /**
   * Analyze patterns for debugging
   */
  analyzePatterns(): {
    mostCommonTransitions: Array<{ from: string; to: string; count: number }>;
    averageDepth: { jsx: number; template: number };
    problematicTransitions: StateTransition[];
  } {
    const transitionCounts = new Map<string, number>();
    let totalJsxDepth = 0;
    let totalTemplateDepth = 0;
    let depthSamples = 0;
    
    this.transitions.forEach(t => {
      const key = `${t.from} → ${t.to}`;
      transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
      
      if (t.depth) {
        totalJsxDepth += t.depth.jsx;
        totalTemplateDepth += t.depth.template;
        depthSamples++;
      }
    });
    
    // Most common transitions
    const mostCommonTransitions = Array.from(transitionCounts.entries())
      .map(([key, count]) => {
        const [from, to] = key.split(' → ');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Average depths
    const averageDepth = {
      jsx: depthSamples > 0 ? totalJsxDepth / depthSamples : 0,
      template: depthSamples > 0 ? totalTemplateDepth / depthSamples : 0
    };
    
    // Problematic transitions (unusual patterns)
    const problematicTransitions = this.transitions.filter(t => 
      // Deep nesting
      (t.depth?.jsx && t.depth.jsx > 20) ||
      (t.depth?.template && t.depth.template > 10) ||
      // Unusual trigger patterns
      t.trigger.includes('error') ||
      t.trigger.includes('unexpected')
    );
    
    return {
      mostCommonTransitions,
      averageDepth,
      problematicTransitions
    };
  }
}