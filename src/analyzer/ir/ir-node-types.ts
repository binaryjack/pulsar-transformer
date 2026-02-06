/**
 * IR (Intermediate Representation) Node Types
 *
 * Optimized representation for transformation and code generation.
 */

/**
 * IR Node Types Enum
 */
export enum IRNodeType {
  // Program IR
  PROGRAM_IR = 'ProgramIR',

  // Component IR
  COMPONENT_IR = 'ComponentIR',
  COMPONENT_CALL_IR = 'ComponentCallIR',
  ELEMENT_IR = 'ElementIR',
  SIGNAL_BINDING_IR = 'SignalBindingIR',
  EVENT_HANDLER_IR = 'EventHandlerIR',

  // Expression IR
  LITERAL_IR = 'LiteralIR',
  IDENTIFIER_IR = 'IdentifierIR',
  CALL_EXPRESSION_IR = 'CallExpressionIR',
  ARROW_FUNCTION_IR = 'ArrowFunctionIR',
  BINARY_EXPRESSION_IR = 'BinaryExpressionIR',
  MEMBER_EXPRESSION_IR = 'MemberExpressionIR',
  CONDITIONAL_EXPRESSION_IR = 'ConditionalExpressionIR',

  // Statement IR
  VARIABLE_DECLARATION_IR = 'VariableDeclarationIR',
  RETURN_STATEMENT_IR = 'ReturnStatementIR',
  IMPORT = 'ImportIR',
  EXPORT = 'ExportIR',

  // Registry Pattern IR
  REGISTRY_REGISTRATION_IR = 'RegistryRegistrationIR',
  REGISTRY_LOOKUP_IR = 'RegistryLookupIR',
}

/**
 * Base IR Node
 */
export interface IIRNode {
  type: IRNodeType;
  metadata: IIRMetadata;
}

/**
 * IR Metadata (optimization hints, analysis data)
 */
export interface IIRMetadata {
  /**
   * Source location for debugging
   */
  sourceLocation?: {
    line: number;
    column: number;
    offset: number;
  };

  /**
   * Optimization hints
   */
  optimizations?: {
    canInline?: boolean;
    isStatic?: boolean;
    isPure?: boolean;
  };

  /**
   * Dependency tracking
   */
  dependencies?: string[];

  /**
   * Type information
   */
  inferredType?: string;
}

/**
 * Component IR Node
 */
export interface IComponentIR extends IIRNode {
  type: IRNodeType.COMPONENT_IR;
  name: string;
  params: IIdentifierIR[];
  body: IIRNode[];
  returnExpression: IIRNode | null;

  /**
   * Reactive dependencies detected in component
   */
  reactiveDependencies: string[];

  /**
   * Registry information
   */
  registryKey: string;

  /**
   * Whether component uses signals
   */
  usesSignals: boolean;

  /**
   * Whether component has event handlers
   */
  hasEventHandlers: boolean;
}

/**
 * Element IR Node
 */
export interface IElementIR extends IIRNode {
  type: IRNodeType.ELEMENT_IR;
  tagName: string;
  attributes: IAttributeIR[];
  children: IIRNode[];
  selfClosing: boolean;

  /**
   * Static vs dynamic classification
   */
  isStatic: boolean;

  /**
   * Event handlers attached
   */
  eventHandlers: IEventHandlerIR[];

  /**
   * Signal bindings in this element
   */
  signalBindings: ISignalBindingIR[];
}

/**
 * Component Call IR Node
 *
 * Represents a call to another component (e.g., <Card />)
 */
export interface IComponentCallIR extends IIRNode {
  type: IRNodeType.COMPONENT_CALL_IR;
  componentName: string;
  attributes: IAttributeIR[];
  children: IIRNode[];
  selfClosing: boolean;
}

/**
 * Attribute IR
 */
export interface IAttributeIR {
  name: string;
  value: IIRNode | null;
  isStatic: boolean;
  isDynamic: boolean;
}

/**
 * Signal Binding IR Node
 */
export interface ISignalBindingIR extends IIRNode {
  type: IRNodeType.SIGNAL_BINDING_IR;
  signalName: string;

  /**
   * Optimization: direct signal reference
   */
  canOptimize: boolean;

  /**
   * Whether signal is from parent scope
   */
  isExternal: boolean;
}

/**
 * Event Handler IR Node
 */
export interface IEventHandlerIR extends IIRNode {
  type: IRNodeType.EVENT_HANDLER_IR;
  eventName: string;
  handler: IIRNode;

  /**
   * Whether handler is inline or reference
   */
  isInline: boolean;

  /**
   * Whether handler accesses signals
   */
  accessesSignals: boolean;
}

/**
 * Literal IR Node
 */
export interface ILiteralIR extends IIRNode {
  type: IRNodeType.LITERAL_IR;
  value: string | number | boolean | null;
  rawValue: string;
}

/**
 * Identifier IR Node
 */
export interface IIdentifierIR extends IIRNode {
  type: IRNodeType.IDENTIFIER_IR;
  name: string;

  /**
   * Scope information
   */
  scope: 'local' | 'parameter' | 'global' | 'imported';

  /**
   * Whether this identifier is a signal
   */
  isSignal: boolean;
}

/**
 * Call Expression IR Node
 */
export interface ICallExpressionIR extends IIRNode {
  type: IRNodeType.CALL_EXPRESSION_IR;
  callee: IIRNode;
  arguments: IIRNode[];

  /**
   * Whether this is a signal creation call
   */
  isSignalCreation: boolean;

  /**
   * Whether this is a Pulsar primitive call
   */
  isPulsarPrimitive: boolean;
}

/**
 * Binary Expression IR Node
 */
export interface IBinaryExpressionIR extends IIRNode {
  type: IRNodeType.BINARY_EXPRESSION_IR;
  operator: string;
  left: IIRNode;
  right: IIRNode;
}

/**
 * Member Expression IR Node
 */
export interface IMemberExpressionIR extends IIRNode {
  type: IRNodeType.MEMBER_EXPRESSION_IR;
  object: IIRNode;
  property: IIdentifierIR;
}

/**
 * Conditional Expression IR Node
 */
export interface IConditionalExpressionIR extends IIRNode {
  type: IRNodeType.CONDITIONAL_EXPRESSION_IR;
  test: IIRNode;
  consequent: IIRNode;
  alternate: IIRNode;
}

/**
 * Arrow Function IR Node
 */
export interface IArrowFunctionIR extends IIRNode {
  type: IRNodeType.ARROW_FUNCTION_IR;
  params: IIdentifierIR[];
  body: IIRNode | IIRNode[];

  /**
   * Captured variables from outer scope
   */
  captures: string[];

  /**
   * Whether function is pure (no side effects)
   */
  isPure: boolean;
}

/**
 * Variable Declaration IR Node
 */
export interface IVariableDeclarationIR extends IIRNode {
  type: IRNodeType.VARIABLE_DECLARATION_IR;
  kind: 'const' | 'let';
  name: string;
  initializer: IIRNode | null;

  /**
   * Whether this declares a signal
   */
  isSignalDeclaration: boolean;

  /**
   * Whether this uses destructuring syntax
   */
  isDestructuring?: boolean;

  /**
   * Names in destructuring pattern (e.g., [a, b])
   */
  destructuringNames?: string[];
}

/**
 * Return Statement IR Node
 */
export interface IReturnStatementIR extends IIRNode {
  type: IRNodeType.RETURN_STATEMENT_IR;
  argument: IIRNode | null;
}

/**
 * Registry Registration IR Node
 */
export interface IRegistryRegistrationIR extends IIRNode {
  type: IRNodeType.REGISTRY_REGISTRATION_IR;
  componentName: string;
  registryKey: string;
  componentRef: IComponentIR;
}

/**
 * Registry Lookup IR Node
 */
export interface IRegistryLookupIR extends IIRNode {
  type: IRNodeType.REGISTRY_LOOKUP_IR;
  componentName: string;
  registryKey: string;
}

/**
 * Import IR Node
 */
export interface IImportIR extends IIRNode {
  type: IRNodeType.IMPORT;
  source: string;
  specifiers: IImportSpecifierIR[];
  isTypeOnly?: boolean;
}

/**
 * Import Specifier IR
 */
export interface IImportSpecifierIR {
  type: 'ImportSpecifier' | 'ImportDefaultSpecifier' | 'ImportNamespaceSpecifier';
  imported: string;
  local: string;
  isTypeOnly?: boolean;
}

/**
 * Export IR Node
 */
export interface IExportIR extends IIRNode {
  type: IRNodeType.EXPORT;
  exportKind: 'named' | 'default' | 'all';
  specifiers: IExportSpecifierIR[];
  source: string | null;
  isTypeOnly?: boolean;
}

/**
 * Export Specifier IR
 */
export interface IExportSpecifierIR {
  type: 'ExportSpecifier';
  exported: string;
  local: string;
  isTypeOnly?: boolean;
}
