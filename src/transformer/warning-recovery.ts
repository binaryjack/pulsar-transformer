/**
 * Transformer Warning Recovery - Error recovery and graceful degradation
 * Similar to lexer warning recovery but for AST transformation failures
 */

import type { IASTNode, IProgramNode } from '../parser/parser.types.js';
import type { ITransformerDiagnostic } from './diagnostics.js';
import type { ITransformer } from './transformer.js';

export type RecoveryStrategy =
  | 'SKIP_NODE'
  | 'DEFAULT_TRANSFORM'
  | 'MINIMAL_TRANSFORM'
  | 'PASS_THROUGH'
  | 'FALLBACK_IMPLEMENTATION'
  | 'ABORT_TRANSFORMATION';

export interface IRecoveryAction {
  strategy: RecoveryStrategy;
  reason: string;
  originalNode: IASTNode;
  recoveredNode?: IASTNode;
  diagnostics: ITransformerDiagnostic[];
  timestamp: number;
}

export interface IRecoveryConfig {
  enabled: boolean;
  maxRecoveryAttempts: number;
  fallbackToMinimalTransform: boolean;
  skipUnsupportedNodes: boolean;
  preserveOriginalOnFailure: boolean;
  logRecoveryActions: boolean;
}

/**
 * Recovery controller for handling transformation failures gracefully
 */
export class TransformerRecoveryController {
  private config: IRecoveryConfig;
  private recoveryActions: IRecoveryAction[] = [];
  private recoveryAttempts: Map<string, number> = new Map();

  constructor(config: Partial<IRecoveryConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      maxRecoveryAttempts: config.maxRecoveryAttempts ?? 3,
      fallbackToMinimalTransform: config.fallbackToMinimalTransform ?? true,
      skipUnsupportedNodes: config.skipUnsupportedNodes ?? false,
      preserveOriginalOnFailure: config.preserveOriginalOnFailure ?? true,
      logRecoveryActions: config.logRecoveryActions ?? true,
    };
  }

  /**
   * Attempt to recover from transformation error
   */
  attemptRecovery(
    transformer: ITransformer,
    node: IASTNode,
    error: Error,
    transformMethod: string
  ): IASTNode {
    if (!this.config.enabled) {
      throw error; // No recovery, re-throw original error
    }

    const nodeKey = `${node.type}_${node.start}_${node.end}`;
    const attempts = this.recoveryAttempts.get(nodeKey) || 0;

    if (attempts >= this.config.maxRecoveryAttempts) {
      this.logRecoveryAction({
        strategy: 'ABORT_TRANSFORMATION',
        reason: `Max recovery attempts (${this.config.maxRecoveryAttempts}) exceeded`,
        originalNode: node,
        diagnostics: [
          {
            code: 'TRF505',
            type: 'error',
            severity: 'critical',
            phase: 'statement',
            message: `Recovery failed after ${attempts} attempts: ${error.message}`,
            node,
          },
        ],
        timestamp: Date.now(),
      });
      throw error;
    }

    this.recoveryAttempts.set(nodeKey, attempts + 1);

    // Determine recovery strategy based on node type and error
    const strategy = this.determineRecoveryStrategy(node, error, transformMethod);
    const recoveredNode = this.applyRecoveryStrategy(strategy, node, error, transformer);

    this.logRecoveryAction({
      strategy,
      reason: `${transformMethod} failed: ${error.message}`,
      originalNode: node,
      recoveredNode,
      diagnostics: [
        {
          code: 'TRF504',
          type: 'warning',
          severity: 'medium',
          phase: 'statement',
          message: `Applied recovery strategy '${strategy}' for ${node.type}`,
          node,
        },
      ],
      timestamp: Date.now(),
    });

    return recoveredNode;
  }

  /**
   * Recover from component transformation failure
   */
  recoverComponentTransformation(
    transformer: ITransformer,
    componentNode: any,
    error: Error
  ): IASTNode {
    // Try minimal component transformation
    try {
      const minimalComponent = this.createMinimalComponent(componentNode);

      this.logRecoveryAction({
        strategy: 'MINIMAL_TRANSFORM',
        reason: `Component transformation failed, using minimal implementation: ${error.message}`,
        originalNode: componentNode,
        recoveredNode: minimalComponent,
        diagnostics: [
          {
            code: 'TRF001',
            type: 'warning',
            severity: 'high',
            phase: 'component',
            message: 'Component transformed using minimal fallback implementation',
            node: componentNode,
          },
        ],
        timestamp: Date.now(),
      });

      return minimalComponent;
    } catch (recoveryError) {
      // If minimal transform also fails, pass through original
      return this.passThrough(componentNode, 'Component recovery failed');
    }
  }

  /**
   * Recover from JSX transformation failure
   */
  recoverJSXTransformation(transformer: ITransformer, jsxNode: any, error: Error): IASTNode {
    if (this.config.skipUnsupportedNodes) {
      // Create placeholder JSX element
      const placeholder = {
        type: 'JSXElement',
        openingElement: {
          type: 'JSXOpeningElement',
          name: { type: 'JSXIdentifier', name: 'div' },
          attributes: [],
          selfClosing: true,
        },
        children: [],
        start: jsxNode.start,
        end: jsxNode.end,
      };

      this.logRecoveryAction({
        strategy: 'DEFAULT_TRANSFORM',
        reason: `JSX transformation failed, using placeholder: ${error.message}`,
        originalNode: jsxNode,
        recoveredNode: placeholder,
        diagnostics: [
          {
            code: 'TRF101',
            type: 'warning',
            severity: 'medium',
            phase: 'jsx',
            message: 'JSX element replaced with placeholder div',
            node: jsxNode,
          },
        ],
        timestamp: Date.now(),
      });

      return placeholder;
    }

    return this.passThrough(jsxNode, 'JSX transformation failed');
  }

  /**
   * Recover from import injection failure
   */
  recoverImportInjection(transformer: ITransformer, programNode: IProgramNode, error: Error): void {
    // Try to add basic imports only
    try {
      const basicImports = this.createBasicImports();
      programNode.body.unshift(...basicImports);

      this.logRecoveryAction({
        strategy: 'MINIMAL_TRANSFORM',
        reason: `Full import injection failed, added basic imports: ${error.message}`,
        originalNode: programNode,
        diagnostics: [
          {
            code: 'TRF201',
            type: 'warning',
            severity: 'medium',
            phase: 'import',
            message: 'Added minimal framework imports after injection failure',
            node: programNode,
          },
        ],
        timestamp: Date.now(),
      });
    } catch (recoveryError) {
      const errorMsg =
        recoveryError instanceof Error ? recoveryError.message : String(recoveryError);
      this.logRecoveryAction({
        strategy: 'SKIP_NODE',
        reason: `Import recovery also failed: ${errorMsg}`,
        originalNode: programNode,
        diagnostics: [
          {
            code: 'TRF202',
            type: 'error',
            severity: 'high',
            phase: 'import',
            message: 'Failed to recover from import injection failure',
            node: programNode,
          },
        ],
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats() {
    const byStrategy = this.recoveryActions.reduce(
      (acc, action) => {
        acc[action.strategy] = (acc[action.strategy] || 0) + 1;
        return acc;
      },
      {} as Record<RecoveryStrategy, number>
    );

    const byNodeType = this.recoveryActions.reduce(
      (acc, action) => {
        const nodeType = action.originalNode.type;
        acc[nodeType] = (acc[nodeType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalRecoveries: this.recoveryActions.length,
      byStrategy,
      byNodeType,
      successRate: this.calculateSuccessRate(),
    };
  }

  /**
   * Clear recovery history
   */
  clearRecoveryHistory(): void {
    this.recoveryActions = [];
    this.recoveryAttempts.clear();
  }

  // Private methods

  private determineRecoveryStrategy(
    node: IASTNode,
    error: Error,
    transformMethod: string
  ): RecoveryStrategy {
    // Strategy selection based on node type and error
    if (node.type === 'ComponentDeclaration') {
      return this.config.fallbackToMinimalTransform ? 'MINIMAL_TRANSFORM' : 'PASS_THROUGH';
    }

    if (node.type === 'JSXElement') {
      return this.config.skipUnsupportedNodes ? 'DEFAULT_TRANSFORM' : 'PASS_THROUGH';
    }

    if (transformMethod.includes('Import')) {
      return 'MINIMAL_TRANSFORM';
    }

    // Default strategy
    return this.config.preserveOriginalOnFailure ? 'PASS_THROUGH' : 'SKIP_NODE';
  }

  private applyRecoveryStrategy(
    strategy: RecoveryStrategy,
    node: IASTNode,
    error: Error,
    transformer: ITransformer
  ): IASTNode {
    switch (strategy) {
      case 'SKIP_NODE':
        return this.createNullNode(node);

      case 'DEFAULT_TRANSFORM':
        return this.createDefaultTransform(node);

      case 'MINIMAL_TRANSFORM':
        return this.createMinimalTransform(node, transformer);

      case 'PASS_THROUGH':
        return this.passThrough(node, error.message);

      case 'FALLBACK_IMPLEMENTATION':
        return this.createFallbackImplementation(node);

      default:
        return node; // No transformation
    }
  }

  private createMinimalComponent(componentNode: any): any {
    // Create minimal component transformation
    return {
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: componentNode.name.name },
          init: {
            type: 'ArrowFunctionExpression',
            params: componentNode.params || [],
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'CallExpression',
                    callee: {
                      type: 'MemberExpression',
                      object: { type: 'Identifier', name: '$REGISTRY' },
                      property: { type: 'Identifier', name: 'execute' },
                    },
                    arguments: [
                      { type: 'Literal', value: `component:${componentNode.name.name}` },
                      { type: 'ArrowFunctionExpression', params: [], body: componentNode.body },
                    ],
                  },
                },
              ],
            },
          },
        },
      ],
      start: componentNode.start,
      end: componentNode.end,
    };
  }

  private createBasicImports(): any[] {
    return [
      {
        type: 'ImportDeclaration',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: { type: 'Identifier', name: '$REGISTRY' },
            local: { type: 'Identifier', name: '$REGISTRY' },
          },
        ],
        source: {
          type: 'Literal',
          value: '@pulsar-framework/pulsar.dev',
        },
      },
    ];
  }

  private createNullNode(originalNode: IASTNode): IASTNode {
    // Create a minimal null representation
    return {
      type: 'Literal',
      value: null,
      start: originalNode.start,
      end: originalNode.end,
    } as any;
  }

  private createDefaultTransform(node: IASTNode): IASTNode {
    // Create safe default transformation based on node type
    if (node.type === 'JSXElement') {
      return {
        type: 'JSXElement',
        openingElement: {
          type: 'JSXOpeningElement',
          name: { type: 'JSXIdentifier', name: 'div' },
          attributes: [],
          selfClosing: true,
        },
        children: [],
        start: node.start,
        end: node.end,
      } as any;
    }
    return node; // Pass through for unknown types
  }

  private createMinimalTransform(node: IASTNode, transformer: ITransformer): IASTNode {
    // Attempt very basic transformation
    try {
      if (node.type === 'ComponentDeclaration') {
        return this.createMinimalComponent(node);
      }
      return node;
    } catch {
      return node; // If minimal transform fails, pass through
    }
  }

  private passThrough(node: IASTNode, reason: string): IASTNode {
    // Return original node unchanged
    return { ...node, _recoveryReason: reason } as any;
  }

  private createFallbackImplementation(node: IASTNode): IASTNode {
    // Create fallback based on node type
    return this.createDefaultTransform(node);
  }

  private logRecoveryAction(action: IRecoveryAction): void {
    this.recoveryActions.push(action);

    if (this.config.logRecoveryActions) {
      console.warn(`[TRANSFORMER-RECOVERY] ${action.strategy}: ${action.reason}`, {
        nodeType: action.originalNode.type,
        timestamp: new Date(action.timestamp).toISOString(),
        diagnostics: action.diagnostics.length,
      });
    }
  }

  private calculateSuccessRate(): number {
    if (this.recoveryActions.length === 0) return 100;

    const successful = this.recoveryActions.filter(
      (action) => action.strategy !== 'ABORT_TRANSFORMATION'
    ).length;

    return (successful / this.recoveryActions.length) * 100;
  }
}

/**
 * Global recovery controller instance
 */
let globalRecoveryController: TransformerRecoveryController | null = null;

export function getTransformerRecoveryController(): TransformerRecoveryController {
  if (!globalRecoveryController) {
    globalRecoveryController = new TransformerRecoveryController();
  }
  return globalRecoveryController;
}

export function initializeTransformerRecoveryController(
  config: Partial<IRecoveryConfig>
): TransformerRecoveryController {
  globalRecoveryController = new TransformerRecoveryController(config);
  return globalRecoveryController;
}

export function clearTransformerRecoveryController(): void {
  globalRecoveryController = null;
}
