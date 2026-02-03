/**
 * Emitter Tests
 *
 * Tests for code generation from optimized IR.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type {
  IComponentIR,
  IElementIR,
  IEventHandlerIR,
  ILiteralIR,
  ISignalBindingIR,
  IVariableDeclarationIR,
} from '../../analyzer/ir/ir-node-types.js';
import { IRNodeType } from '../../analyzer/ir/ir-node-types.js';
import { createEmitter } from '../create-emitter.js';
import { createImportTracker } from '../create-import-tracker.js';
import type { IEmitter, IImportTracker } from '../emitter.types.js';

describe('Import Tracker', () => {
  let tracker: IImportTracker;

  beforeEach(() => {
    tracker = createImportTracker();
  });

  it('should create import tracker', () => {
    expect(tracker).toBeDefined();
    expect(tracker.addImport).toBeInstanceOf(Function);
  });

  it('should add single import', () => {
    tracker.addImport('@pulsar/runtime', 'createSignal');

    expect(tracker.hasImport('@pulsar/runtime', 'createSignal')).toBe(true);
  });

  it('should add multiple imports from same source', () => {
    tracker.addImport('@pulsar/runtime', 'createSignal');
    tracker.addImport('@pulsar/runtime', 'createEffect');
    tracker.addImport('@pulsar/runtime', 'createMemo');

    const imports = tracker.getImports();
    const specifiers = imports.get('@pulsar/runtime');

    expect(specifiers).toBeDefined();
    expect(specifiers!.size).toBe(3);
    expect(specifiers!.has('createSignal')).toBe(true);
    expect(specifiers!.has('createEffect')).toBe(true);
    expect(specifiers!.has('createMemo')).toBe(true);
  });

  it('should deduplicate imports', () => {
    tracker.addImport('@pulsar/runtime', 'createSignal');
    tracker.addImport('@pulsar/runtime', 'createSignal');
    tracker.addImport('@pulsar/runtime', 'createSignal');

    const imports = tracker.getImports();
    const specifiers = imports.get('@pulsar/runtime');

    expect(specifiers!.size).toBe(1);
  });

  it('should generate import statements', () => {
    tracker.addImport('@pulsar/runtime', 'createSignal');
    tracker.addImport('@pulsar/runtime', 'createEffect');
    tracker.addImport('@pulsar/runtime/registry', '$REGISTRY');

    const code = tracker.generateImports();

    expect(code).toContain("import { createEffect, createSignal } from '@pulsar/runtime';");
    expect(code).toContain("import { $REGISTRY } from '@pulsar/runtime/registry';");
  });

  it('should sort imports alphabetically', () => {
    tracker.addImport('@pulsar/runtime', 'createEffect');
    tracker.addImport('@pulsar/runtime', 'createSignal');
    tracker.addImport('@pulsar/runtime', 'createMemo');

    const code = tracker.generateImports();

    expect(code).toContain('createEffect, createMemo, createSignal');
  });
});

describe('Emitter', () => {
  let emitter: IEmitter;

  beforeEach(() => {
    emitter = createEmitter();
  });

  describe('basic functionality', () => {
    it('should create emitter instance', () => {
      expect(emitter).toBeDefined();
      expect(emitter.emit).toBeInstanceOf(Function);
    });

    it('should have context', () => {
      const context = emitter.getContext();

      expect(context).toBeDefined();
      expect(context.config).toBeDefined();
      expect(context.imports).toBeDefined();
      expect(context.code).toEqual([]);
    });

    it('should use default config', () => {
      const context = emitter.getContext();

      expect(context.config.format).toBe('esm');
      expect(context.config.indent).toBe('  ');
      expect(context.config.sourceMaps).toBe(false);
      expect(context.config.minify).toBe(false);
    });

    it('should accept custom config', () => {
      const customEmitter = createEmitter({
        format: 'cjs',
        indent: '    ',
        minify: true,
      });

      const context = customEmitter.getContext();

      expect(context.config.format).toBe('cjs');
      expect(context.config.indent).toBe('    ');
      expect(context.config.minify).toBe(true);
    });
  });

  describe('literal emission', () => {
    it('should emit number literal', () => {
      const literalIR: ILiteralIR = {
        type: IRNodeType.LITERAL_IR,
        value: 42,
        rawValue: '42',
        metadata: {},
      };

      const code = emitter.emit(literalIR);

      expect(code).toContain('42');
    });

    it('should emit string literal', () => {
      const literalIR: ILiteralIR = {
        type: IRNodeType.LITERAL_IR,
        value: 'hello',
        rawValue: '"hello"',
        metadata: {},
      };

      const code = emitter.emit(literalIR);

      expect(code).toContain('"hello"');
    });

    it('should emit boolean literal', () => {
      const literalIR: ILiteralIR = {
        type: IRNodeType.LITERAL_IR,
        value: true,
        rawValue: 'true',
        metadata: {},
      };

      const code = emitter.emit(literalIR);

      expect(code).toContain('true');
    });
  });

  describe('variable declaration emission', () => {
    it('should emit const declaration', () => {
      const varIR: IVariableDeclarationIR = {
        type: IRNodeType.VARIABLE_DECLARATION_IR,
        kind: 'const',
        name: 'count',
        initializer: null,
        isSignalDeclaration: false,
        metadata: {},
      };

      const code = emitter.emit(varIR);

      expect(code).toContain('const count;');
    });

    it('should emit signal declaration', () => {
      const varIR: IVariableDeclarationIR = {
        type: IRNodeType.VARIABLE_DECLARATION_IR,
        kind: 'const',
        name: 'count',
        initializer: {
          type: IRNodeType.CALL_EXPRESSION_IR,
          callee: {
            type: IRNodeType.IDENTIFIER_IR,
            name: 'signal',
            scope: 'imported',
            isSignal: false,
            metadata: {},
          },
          arguments: [
            {
              type: IRNodeType.LITERAL_IR,
              value: 0,
              rawValue: '0',
              metadata: {},
            },
          ],
          isSignalCreation: true,
          isPulsarPrimitive: true,
          metadata: {},
        } as any,
        isSignalDeclaration: true,
        isDestructuring: true,
        destructuringNames: ['count', 'setCount'],
        metadata: {},
      };

      const code = emitter.emit(varIR);

      expect(code).toContain('const [count, setCount] = createSignal(');
      expect(code).toContain("import { createSignal } from '@pulsar/runtime'");
    });
  });

  describe('component emission', () => {
    it('should emit simple component', () => {
      const componentIR: IComponentIR = {
        type: IRNodeType.COMPONENT_IR,
        name: 'Counter',
        params: [],
        body: [],
        returnExpression: null,
        reactiveDependencies: [],
        registryKey: 'component:Counter',
        usesSignals: false,
        hasEventHandlers: false,
        metadata: {},
      };

      const code = emitter.emit(componentIR);

      expect(code).toContain('export function Counter(): HTMLElement {');
      expect(code).toContain("return $REGISTRY.execute('component:Counter', () => {");
      expect(code).toContain('});');
      expect(code).toContain("import { $REGISTRY } from '@pulsar/runtime/registry'");
    });

    it('should emit component with parameters', () => {
      const componentIR: IComponentIR = {
        type: IRNodeType.COMPONENT_IR,
        name: 'Button',
        params: [
          {
            type: IRNodeType.IDENTIFIER_IR,
            name: 'label',
            scope: 'parameter',
            isSignal: false,
            metadata: {},
          },
        ],
        body: [],
        returnExpression: null,
        reactiveDependencies: [],
        registryKey: 'component:Button',
        usesSignals: false,
        hasEventHandlers: false,
        metadata: {},
      };

      const code = emitter.emit(componentIR);

      expect(code).toContain('export function Button(label): HTMLElement {');
    });

    it('should add signal import when component uses signals', () => {
      const componentIR: IComponentIR = {
        type: IRNodeType.COMPONENT_IR,
        name: 'Counter',
        params: [],
        body: [],
        returnExpression: null,
        reactiveDependencies: [],
        registryKey: 'component:Counter',
        usesSignals: true,
        hasEventHandlers: false,
        metadata: {},
      };

      const code = emitter.emit(componentIR);

      expect(code).toContain("import { createSignal } from '@pulsar/runtime'");
      expect(code).toContain("import { $REGISTRY } from '@pulsar/runtime/registry'");
    });
  });

  describe('element emission', () => {
    it('should emit simple element', () => {
      const elementIR: IElementIR = {
        type: IRNodeType.ELEMENT_IR,
        tagName: 'div',
        attributes: [],
        children: [],
        selfClosing: false,
        isStatic: true,
        eventHandlers: [],
        signalBindings: [],
        metadata: {},
      };

      const code = emitter.emit(elementIR);

      expect(code).toContain("t_element('div'");
      expect(code).toContain("import { t_element } from '@pulsar/runtime/jsx-runtime'");
    });

    it('should emit element with attributes', () => {
      const elementIR: IElementIR = {
        type: IRNodeType.ELEMENT_IR,
        tagName: 'button',
        attributes: [
          {
            name: 'class',
            value: {
              type: IRNodeType.LITERAL_IR,
              value: 'btn',
              rawValue: '"btn"',
              metadata: {},
            },
            isStatic: true,
            isDynamic: false,
          },
        ],
        children: [],
        selfClosing: false,
        isStatic: true,
        eventHandlers: [],
        signalBindings: [],
        metadata: {},
      };

      const code = emitter.emit(elementIR);

      expect(code).toContain("t_element('button'");
      expect(code).toContain('class');
    });
  });

  describe('event handler emission', () => {
    it('should emit event listener placeholder', () => {
      const eventIR: IEventHandlerIR = {
        type: IRNodeType.EVENT_HANDLER_IR,
        eventName: 'onClick',
        handler: {
          type: IRNodeType.IDENTIFIER_IR,
          name: 'handleClick',
          scope: 'local',
          isSignal: false,
          metadata: {},
        },
        isInline: false,
        accessesSignals: false,
        metadata: {},
      };

      const code = emitter.emit(eventIR);

      expect(code).toContain("addEventListener('click', handleClick)");
    });

    it('should normalize event names', () => {
      const eventIR: IEventHandlerIR = {
        type: IRNodeType.EVENT_HANDLER_IR,
        eventName: 'onMouseEnter',
        handler: {
          type: IRNodeType.IDENTIFIER_IR,
          name: 'handleHover',
          scope: 'local',
          isSignal: false,
          metadata: {},
        },
        isInline: false,
        accessesSignals: false,
        metadata: {},
      };

      const code = emitter.emit(eventIR);

      expect(code).toContain("addEventListener('mouseenter', handleHover)");
    });
  });

  describe('signal binding emission', () => {
    it('should emit signal binding placeholder', () => {
      const bindingIR: ISignalBindingIR = {
        type: IRNodeType.SIGNAL_BINDING_IR,
        signalName: 'count',
        canOptimize: false,
        isExternal: false,
        metadata: {},
      };

      const code = emitter.emit(bindingIR);

      expect(code).toContain('wire count');
      expect(code).toContain("import { $REGISTRY } from '@pulsar/runtime/registry'");
    });
  });

  describe('code formatting', () => {
    it('should include imports at top', () => {
      const literalIR: ILiteralIR = {
        type: IRNodeType.LITERAL_IR,
        value: 42,
        rawValue: '42',
        metadata: {},
      };

      // First emit to add imports
      emitter.getContext().imports.addImport('@pulsar/runtime', 'createSignal');

      const code = emitter.emit(literalIR);
      const lines = code.split('\n');

      expect(lines[0]).toContain('import');
      expect(lines[1]).toBe(''); // Blank line after imports
    });

    it('should apply proper indentation', () => {
      const customEmitter = createEmitter({ indent: '    ' });

      const componentIR: IComponentIR = {
        type: IRNodeType.COMPONENT_IR,
        name: 'Test',
        params: [],
        body: [],
        returnExpression: null,
        reactiveDependencies: [],
        registryKey: 'component:Test',
        usesSignals: false,
        hasEventHandlers: false,
        metadata: {},
      };

      const code = customEmitter.emit(componentIR);

      expect(code).toContain('    return $REGISTRY.execute'); // 4 spaces
    });
  });
});
