/**
 * Transform Strategy Tests
 *
 * Tests all 6 transformation strategies:
 * 1. Component-to-Function
 * 2. Element-to-DOM
 * 3. Signal-to-Reactive
 * 4. Event-to-Listener
 * 5. Attribute-to-Property (TODO)
 * 6. Registry-Registration (TODO)
 */

import ts from 'typescript';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  IComponentIR,
  IElementIR,
  IEventHandlerIR,
  ISignalBindingIR,
} from '../../../analyzer/ir/ir-node-types';
import { createComponentTransformStrategy } from '../strategies/create-component-transform-strategy';
import { ElementTransformStrategy } from '../strategies/element-transform-strategy';
import '../strategies/element-transform-strategy.prototype';
import { EventTransformStrategy } from '../strategies/event-transform-strategy';
import '../strategies/event-transform-strategy.prototype';
import { SignalTransformStrategy } from '../strategies/signal-transform-strategy';
import '../strategies/signal-transform-strategy.prototype';
import { createTransformStrategyManager } from '../strategy-manager';
import type { ITransformContext } from '../transform-strategy.types';

describe('Transform Strategies', () => {
  let context: ITransformContext;

  beforeEach(() => {
    const sourceFile = ts.createSourceFile(
      'test.ts',
      '',
      ts.ScriptTarget.ESNext,
      false,
      ts.ScriptKind.TS
    );

    context = {
      tsContext: {} as ts.TransformationContext,
      sourceFile,
      generatedNodes: [],
      imports: new Map(),
      registrations: [],
      optimizations: {
        staticElements: true,
        signalMemoization: true,
        registryCaching: true,
      },
      errors: [],
    };
  });

  describe('Strategy 1: Component Transform', () => {
    it('should transform ComponentIR to function declaration', () => {
      const strategy = createComponentTransformStrategy();

      const componentIR: IComponentIR = {
        type: 'ComponentIR',
        name: 'Counter',
        parameters: [{ name: 'initialValue', kind: 'parameter', isSignal: false }],
        body: [],
        reactiveDependencies: [],
        registryKey: 'component:Counter',
        usesSignals: true,
        hasEventHandlers: false,
        metadata: {
          canInline: false,
          isStatic: false,
          isPure: false,
        },
      };

      const result = strategy.transform(componentIR, context);

      expect(result).toHaveLength(2); // Function + Registry
      expect(ts.isFunctionDeclaration(result[0])).toBe(true);

      const fnDecl = result[0] as ts.FunctionDeclaration;
      expect(fnDecl.name?.text).toBe('Counter');
    });

    it('should generate registry registration', () => {
      const strategy = createComponentTransformStrategy();

      const componentIR: IComponentIR = {
        type: 'ComponentIR',
        name: 'MyComponent',
        parameters: [],
        body: [],
        reactiveDependencies: [],
        registryKey: 'component:MyComponent',
        usesSignals: false,
        hasEventHandlers: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const registration = strategy.generateRegistration(componentIR, context);

      expect(registration).toHaveLength(1);
      expect(ts.isExpressionStatement(registration[0])).toBe(true);
    });

    it('should generate component parameters', () => {
      const strategy = createComponentTransformStrategy();

      const componentIR: IComponentIR = {
        type: 'ComponentIR',
        name: 'TestComponent',
        parameters: [
          { name: 'prop1', kind: 'parameter', isSignal: false },
          { name: 'prop2', kind: 'parameter', isSignal: false },
        ],
        body: [],
        reactiveDependencies: [],
        registryKey: 'component:TestComponent',
        usesSignals: false,
        hasEventHandlers: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const params = strategy.generateParameters(componentIR);

      expect(params).toHaveLength(2);
      expect((params[0].name as ts.Identifier).text).toBe('prop1');
      expect((params[1].name as ts.Identifier).text).toBe('prop2');
    });

    it('should collect required imports', () => {
      const strategy = createComponentTransformStrategy();

      const componentIR: IComponentIR = {
        type: 'ComponentIR',
        name: 'Counter',
        parameters: [],
        body: [],
        reactiveDependencies: [],
        registryKey: 'component:Counter',
        usesSignals: true,
        hasEventHandlers: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const imports = strategy.getImports(componentIR);

      expect(imports.has('@pulsar/core')).toBe(true);
      expect(imports.get('@pulsar/core')?.has('registry')).toBe(true);
      expect(imports.get('@pulsar/core')?.has('createEffect')).toBe(true);
    });
  });

  describe('Strategy 2: Element Transform', () => {
    it('should transform static element to createElement', () => {
      const strategy = new ElementTransformStrategy();

      const elementIR: IElementIR = {
        type: 'ElementIR',
        tagName: 'div',
        attributes: [],
        children: [],
        signalBindings: [],
        eventHandlers: [],
        isStatic: true,
        metadata: { canInline: true, isStatic: true, isPure: true },
      };

      const result = strategy.generateStaticElement(elementIR, context);

      expect(ts.isCallExpression(result)).toBe(true);
      const callExpr = result as ts.CallExpression;
      expect(ts.isPropertyAccessExpression(callExpr.expression)).toBe(true);
    });

    it('should transform dynamic element', () => {
      const strategy = new ElementTransformStrategy();

      const elementIR: IElementIR = {
        type: 'ElementIR',
        tagName: 'span',
        attributes: [],
        children: [],
        signalBindings: [
          {
            type: 'SignalBindingIR',
            signalName: 'count',
            targetProperty: 'textContent',
            canOptimize: true,
            isExternal: false,
            metadata: { canInline: false, isStatic: false, isPure: false },
          },
        ],
        eventHandlers: [],
        isStatic: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const result = strategy.transformToDOM(elementIR, context);

      expect(ts.isCallExpression(result)).toBe(true);
    });

    it('should collect imports for signal bindings', () => {
      const strategy = new ElementTransformStrategy();

      const elementIR: IElementIR = {
        type: 'ElementIR',
        tagName: 'div',
        attributes: [],
        children: [],
        signalBindings: [
          {
            type: 'SignalBindingIR',
            signalName: 'value',
            targetProperty: 'textContent',
            canOptimize: false,
            isExternal: false,
            metadata: { canInline: false, isStatic: false, isPure: false },
          },
        ],
        eventHandlers: [],
        isStatic: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const imports = strategy.getImports(elementIR);

      expect(imports.has('@pulsar/core')).toBe(true);
      expect(imports.get('@pulsar/core')?.has('createEffect')).toBe(true);
    });
  });

  describe('Strategy 3: Signal Transform', () => {
    it('should transform signal binding to effect subscription', () => {
      const strategy = new SignalTransformStrategy();

      const signalIR: ISignalBindingIR = {
        type: 'SignalBindingIR',
        signalName: 'count',
        targetProperty: 'textContent',
        canOptimize: true,
        isExternal: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const result = strategy.transformToSubscription(signalIR, context);

      expect(result).toHaveLength(1);
      expect(ts.isExpressionStatement(result[0])).toBe(true);
    });

    it('should generate signal read expression', () => {
      const strategy = new SignalTransformStrategy();

      const signalIR: ISignalBindingIR = {
        type: 'SignalBindingIR',
        signalName: 'value',
        targetProperty: 'textContent',
        canOptimize: false,
        isExternal: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const result = strategy.generateSignalRead(signalIR, context);

      expect(ts.isCallExpression(result)).toBe(true);
      const callExpr = result as ts.CallExpression;
      expect(ts.isIdentifier(callExpr.expression)).toBe(true);
      expect((callExpr.expression as ts.Identifier).text).toBe('value');
    });

    it('should generate createEffect wrapper', () => {
      const strategy = new SignalTransformStrategy();

      const signalIR: ISignalBindingIR = {
        type: 'SignalBindingIR',
        signalName: 'count',
        targetProperty: 'textContent',
        canOptimize: true,
        isExternal: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const result = strategy.generateEffect(signalIR, context);

      expect(ts.isCallExpression(result)).toBe(true);
      expect((result.expression as ts.Identifier).text).toBe('createEffect');
    });

    it('should detect optimizable bindings', () => {
      const strategy = new SignalTransformStrategy();

      const optimizableIR: ISignalBindingIR = {
        type: 'SignalBindingIR',
        signalName: 'local',
        targetProperty: 'textContent',
        canOptimize: true,
        isExternal: false,
        metadata: { canInline: true, isStatic: false, isPure: false },
      };

      const nonOptimizableIR: ISignalBindingIR = {
        type: 'SignalBindingIR',
        signalName: 'external',
        targetProperty: 'textContent',
        canOptimize: false,
        isExternal: true,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      expect(strategy.canOptimize(optimizableIR)).toBe(true);
      expect(strategy.canOptimize(nonOptimizableIR)).toBe(false);
    });
  });

  describe('Strategy 4: Event Transform', () => {
    it('should transform event handler to addEventListener', () => {
      const strategy = new EventTransformStrategy();

      const eventIR: IEventHandlerIR = {
        type: 'EventHandlerIR',
        eventName: 'onClick',
        handler: {
          type: 'ArrowFunctionIR',
          parameters: [{ name: 'e', kind: 'parameter', isSignal: false }],
          body: [],
          metadata: { canInline: false, isStatic: false, isPure: false },
        },
        accessesSignals: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const result = strategy.transformToListener(eventIR, context);

      expect(ts.isExpressionStatement(result)).toBe(true);
    });

    it('should normalize event names', () => {
      const strategy = new EventTransformStrategy();

      expect(strategy.normalizeEventName('onClick')).toBe('click');
      expect(strategy.normalizeEventName('onMouseMove')).toBe('mousemove');
      expect(strategy.normalizeEventName('onKeyDown')).toBe('keydown');
    });

    it('should generate listener function', () => {
      const strategy = new EventTransformStrategy();

      const eventIR: IEventHandlerIR = {
        type: 'EventHandlerIR',
        eventName: 'onClick',
        handler: {
          type: 'ArrowFunctionIR',
          parameters: [],
          body: [],
          metadata: { canInline: false, isStatic: false, isPure: false },
        },
        accessesSignals: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const result = strategy.generateListenerFunction(eventIR, context);

      expect(ts.isArrowFunction(result)).toBe(true);
      expect(result.parameters).toHaveLength(1);
      expect((result.parameters[0].name as ts.Identifier).text).toBe('e');
    });
  });

  describe('Strategy Manager', () => {
    it('should register strategies', () => {
      const manager = createTransformStrategyManager();
      const componentStrategy = createComponentTransformStrategy();
      const elementStrategy = new ElementTransformStrategy();

      manager.registerStrategy(componentStrategy);
      manager.registerStrategy(elementStrategy);

      expect(manager.getAllStrategies()).toHaveLength(2);
    });

    it('should get strategy for IR node', () => {
      const manager = createTransformStrategyManager();
      const componentStrategy = createComponentTransformStrategy();

      manager.registerStrategy(componentStrategy);

      const componentIR: IComponentIR = {
        type: 'ComponentIR',
        name: 'Test',
        parameters: [],
        body: [],
        reactiveDependencies: [],
        registryKey: 'component:Test',
        usesSignals: false,
        hasEventHandlers: false,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const strategy = manager.getStrategy(componentIR);

      expect(strategy).toBeDefined();
      expect(strategy?.name).toBe('ComponentTransformStrategy');
    });

    it('should get strategies by type', () => {
      const manager = createTransformStrategyManager();
      const componentStrategy = createComponentTransformStrategy();

      manager.registerStrategy(componentStrategy);

      const strategies = manager.getStrategiesByType('ComponentIR');

      expect(strategies).toHaveLength(1);
      expect(strategies[0].name).toBe('ComponentTransformStrategy');
    });

    it('should return undefined for unknown node type', () => {
      const manager = createTransformStrategyManager();

      const unknownIR = {
        type: 'UnknownIR',
        metadata: { canInline: false, isStatic: false, isPure: false },
      } as any;

      const strategy = manager.getStrategy(unknownIR);

      expect(strategy).toBeUndefined();
    });
  });

  describe('Integration', () => {
    it('should transform complete component with all strategies', () => {
      const componentStrategy = createComponentTransformStrategy();
      const elementStrategy = new ElementTransformStrategy();
      const signalStrategy = new SignalTransformStrategy();
      const eventStrategy = new EventTransformStrategy();

      const componentIR: IComponentIR = {
        type: 'ComponentIR',
        name: 'InteractiveCounter',
        parameters: [],
        body: [
          {
            type: 'VariableDeclarationIR',
            name: 'count',
            kind: 'const',
            isSignal: true,
            metadata: { canInline: false, isStatic: false, isPure: false },
          },
        ],
        reactiveDependencies: ['count'],
        registryKey: 'component:InteractiveCounter',
        usesSignals: true,
        hasEventHandlers: true,
        metadata: { canInline: false, isStatic: false, isPure: false },
      };

      const result = componentStrategy.transform(componentIR, context);

      expect(result).toHaveLength(2);
      expect(ts.isFunctionDeclaration(result[0])).toBe(true);
      expect(context.imports.has('@pulsar/core')).toBe(true);
    });
  });
});
