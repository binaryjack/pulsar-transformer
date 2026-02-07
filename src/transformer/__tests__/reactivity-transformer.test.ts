/**
 * Unit Tests - Reactivity Transformer
 */

import { describe, expect, it } from 'vitest';
import type { ICallExpressionIR, IIdentifierIR } from '../../analyzer/ir/ir-node-types.js';
import { IRNodeType } from '../../analyzer/ir/ir-node-types.js';
import { transformReactivity } from '../reactivity-transformer.js';

describe('Reactivity Transformer', () => {
  it('should transform signal() to createSignal()', () => {
    const ir: ICallExpressionIR = {
      type: IRNodeType.CALL_EXPRESSION_IR,
      callee: {
        type: IRNodeType.IDENTIFIER_IR,
        name: 'signal',
        scope: 'global',
        isSignal: false,
        metadata: {},
      } as IIdentifierIR,
      arguments: [],
      isSignalCreation: true,
      isPulsarPrimitive: true,
      metadata: {},
    };

    const result = transformReactivity(ir) as ICallExpressionIR;

    expect(result.type).toBe(IRNodeType.CALL_EXPRESSION_IR);
    expect((result.callee as IIdentifierIR).name).toBe('createSignal');
  });

  it('should transform computed() to createMemo()', () => {
    const ir: ICallExpressionIR = {
      type: IRNodeType.CALL_EXPRESSION_IR,
      callee: {
        type: IRNodeType.IDENTIFIER_IR,
        name: 'computed',
        scope: 'global',
        isSignal: false,
        metadata: {},
      } as IIdentifierIR,
      arguments: [],
      isSignalCreation: false,
      isPulsarPrimitive: false,
      metadata: {},
    };

    const result = transformReactivity(ir) as ICallExpressionIR;

    expect((result.callee as IIdentifierIR).name).toBe('createMemo');
  });

  it('should transform effect() to createEffect()', () => {
    const ir: ICallExpressionIR = {
      type: IRNodeType.CALL_EXPRESSION_IR,
      callee: {
        type: IRNodeType.IDENTIFIER_IR,
        name: 'effect',
        scope: 'global',
        isSignal: false,
        metadata: {},
      } as IIdentifierIR,
      arguments: [],
      isSignalCreation: false,
      isPulsarPrimitive: false,
      metadata: {},
    };

    const result = transformReactivity(ir) as ICallExpressionIR;

    expect((result.callee as IIdentifierIR).name).toBe('createEffect');
  });

  it('should not transform non-reactivity functions', () => {
    const ir: ICallExpressionIR = {
      type: IRNodeType.CALL_EXPRESSION_IR,
      callee: {
        type: IRNodeType.IDENTIFIER_IR,
        name: 'someOtherFunction',
        scope: 'global',
        isSignal: false,
        metadata: {},
      } as IIdentifierIR,
      arguments: [],
      isSignalCreation: false,
      isPulsarPrimitive: false,
      metadata: {},
    };

    const result = transformReactivity(ir) as ICallExpressionIR;

    expect((result.callee as IIdentifierIR).name).toBe('someOtherFunction');
  });

  it('should handle nested transformations', () => {
    const ir: ICallExpressionIR = {
      type: IRNodeType.CALL_EXPRESSION_IR,
      callee: {
        type: IRNodeType.IDENTIFIER_IR,
        name: 'signal',
        scope: 'global',
        isSignal: false,
        metadata: {},
      } as IIdentifierIR,
      arguments: [
        {
          type: IRNodeType.CALL_EXPRESSION_IR,
          callee: {
            type: IRNodeType.IDENTIFIER_IR,
            name: 'computed',
            scope: 'global',
            isSignal: false,
            metadata: {},
          } as IIdentifierIR,
          arguments: [],
          isSignalCreation: false,
          isPulsarPrimitive: false,
          metadata: {},
        } as ICallExpressionIR,
      ],
      isSignalCreation: true,
      isPulsarPrimitive: true,
      metadata: {},
    };

    const result = transformReactivity(ir) as ICallExpressionIR;

    expect((result.callee as IIdentifierIR).name).toBe('createSignal');
    const arg = result.arguments[0] as ICallExpressionIR;
    expect((arg.callee as IIdentifierIR).name).toBe('createMemo');
  });
});
