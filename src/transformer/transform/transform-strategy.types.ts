/**
 * Transform Strategy Type Definitions
 * 
 * Defines interfaces for transformation strategies that convert IR nodes
 * into optimized TypeScript code using Registry Pattern.
 * 
 * 6 Transformation Strategies:
 * 1. Component-to-Function: Component IR → Registry-registered function
 * 2. Element-to-DOM: Element IR → DOM creation code
 * 3. Signal-to-Reactive: Signal binding → Reactive subscription
 * 4. Event-to-Listener: Event handler → DOM listener
 * 5. Attribute-to-Property: Attributes → DOM property/attribute setting
 * 6. Registry-Registration: Registry API generation
 */

import type ts from 'typescript';
import type {
  IComponentIR,
  IElementIR,
  ISignalBindingIR,
  IEventHandlerIR,
  ILiteralIR,
  IIdentifierIR,
  ICallExpressionIR,
  IArrowFunctionIR,
  IVariableDeclarationIR,
  IReturnStatementIR,
  IRegistryRegistrationIR,
  IRegistryLookupIR,
  IRNode,
} from '../../analyzer/ir/ir-node-types';

/**
 * Transform context passed to strategies
 */
export interface ITransformContext {
  /** TypeScript transformation context */
  tsContext: ts.TransformationContext;

  /** Current file being transformed */
  sourceFile: ts.SourceFile;

  /** Generated TypeScript nodes */
  generatedNodes: ts.Node[];

  /** Import statements to add */
  imports: Map<string, Set<string>>;

  /** Registry registrations to add */
  registrations: IRegistryRegistrationIR[];

  /** Optimization flags */
  optimizations: {
    /** Enable static element optimization */
    staticElements: boolean;
    /** Enable signal memoization */
    signalMemoization: boolean;
    /** Enable registry caching */
    registryCaching: boolean;
  };

  /** Error tracking */
  errors: ITransformError[];
}

/**
 * Transform error
 */
export interface ITransformError {
  /** Error message */
  message: string;

  /** IR node that caused error */
  node: IRNode;

  /** Severity */
  severity: 'error' | 'warning';

  /** Source location */
  location?: {
    line: number;
    column: number;
  };
}

/**
 * Base transform strategy
 */
export interface ITransformStrategy<T extends IRNode = IRNode> {
  /** Strategy name */
  readonly name: string;

  /** IR node types this strategy handles */
  readonly handles: string[];

  /** Can this strategy transform the given node? */
  canTransform(node: IRNode): node is T;

  /** Transform IR node to TypeScript AST */
  transform(node: T, context: ITransformContext): ts.Node | ts.Node[];

  /** Get required imports for this transformation */
  getImports(node: T): Map<string, Set<string>>;
}

/**
 * Component transformation strategy
 * Converts ComponentIR → Registry-registered function
 */
export interface IComponentTransformStrategy extends ITransformStrategy<IComponentIR> {
  /** Transform component to function declaration */
  transformToFunction(component: IComponentIR, context: ITransformContext): ts.FunctionDeclaration;

  /** Generate registry registration code */
  generateRegistration(component: IComponentIR, context: ITransformContext): ts.Statement[];

  /** Generate component parameter bindings */
  generateParameters(component: IComponentIR): ts.ParameterDeclaration[];
}

/**
 * Element transformation strategy
 * Converts ElementIR → DOM creation code
 */
export interface IElementTransformStrategy extends ITransformStrategy<IElementIR> {
  /** Transform element to DOM creation */
  transformToDOM(element: IElementIR, context: ITransformContext): ts.Expression;

  /** Generate static element (no reactivity) */
  generateStaticElement(element: IElementIR, context: ITransformContext): ts.Expression;

  /** Generate dynamic element (with reactivity) */
  generateDynamicElement(element: IElementIR, context: ITransformContext): ts.Expression;

  /** Generate child attachment code */
  generateChildren(element: IElementIR, context: ITransformContext): ts.Statement[];
}

/**
 * Signal binding transformation strategy
 * Converts SignalBindingIR → Reactive subscription
 */
export interface ISignalTransformStrategy extends ITransformStrategy<ISignalBindingIR> {
  /** Transform signal binding to reactive subscription */
  transformToSubscription(binding: ISignalBindingIR, context: ITransformContext): ts.Statement[];

  /** Generate signal read expression */
  generateSignalRead(binding: ISignalBindingIR, context: ITransformContext): ts.Expression;

  /** Generate effect for reactive update */
  generateEffect(binding: ISignalBindingIR, context: ITransformContext): ts.CallExpression;

  /** Can optimize this binding? */
  canOptimize(binding: ISignalBindingIR): boolean;
}

/**
 * Event handler transformation strategy
 * Converts EventHandlerIR → DOM listener
 */
export interface IEventTransformStrategy extends ITransformStrategy<IEventHandlerIR> {
  /** Transform event handler to addEventListener */
  transformToListener(handler: IEventHandlerIR, context: ITransformContext): ts.Statement;

  /** Generate event listener function */
  generateListenerFunction(handler: IEventHandlerIR, context: ITransformContext): ts.ArrowFunction;

  /** Normalize event name (onClick → click) */
  normalizeEventName(eventName: string): string;
}

/**
 * Attribute transformation strategy
 * Converts attributes → DOM property/attribute setting
 */
export interface IAttributeTransformStrategy extends ITransformStrategy {
  /** Transform attribute to property setting */
  transformToProperty(name: string, value: ts.Expression, context: ITransformContext): ts.Statement;

  /** Transform attribute to setAttribute call */
  transformToAttribute(name: string, value: ts.Expression, context: ITransformContext): ts.Statement;

  /** Should use property vs attribute? */
  shouldUseProperty(name: string): boolean;

  /** Normalize attribute name */
  normalizeAttributeName(name: string): string;
}

/**
 * Registry transformation strategy
 * Generates Registry API registration code
 */
export interface IRegistryTransformStrategy extends ITransformStrategy<IRegistryRegistrationIR> {
  /** Transform to registry.register call */
  transformToRegistration(registration: IRegistryRegistrationIR, context: ITransformContext): ts.Statement;

  /** Generate component factory wrapper */
  generateFactory(component: IComponentIR, context: ITransformContext): ts.ArrowFunction;

  /** Generate registry import */
  generateImport(context: ITransformContext): ts.ImportDeclaration;
}

/**
 * Transform strategy manager
 */
export interface ITransformStrategyManager {
  /** Register a transformation strategy */
  registerStrategy(strategy: ITransformStrategy): void;

  /** Get strategy for IR node */
  getStrategy(node: IRNode): ITransformStrategy | undefined;

  /** Get all strategies */
  getAllStrategies(): ITransformStrategy[];

  /** Get strategies by type */
  getStrategiesByType(type: string): ITransformStrategy[];
}

/**
 * Transform strategy config
 */
export interface ITransformStrategyConfig {
  /** Enable static optimizations */
  enableStaticOptimizations?: boolean;

  /** Enable signal memoization */
  enableSignalMemoization?: boolean;

  /** Enable registry caching */
  enableRegistryCaching?: boolean;

  /** Collect transformation errors */
  collectErrors?: boolean;

  /** Max errors before stopping */
  maxErrors?: number;
}

/**
 * Transform result
 */
export interface ITransformResult {
  /** Generated TypeScript source file */
  sourceFile: ts.SourceFile;

  /** Import statements */
  imports: ts.ImportDeclaration[];

  /** Registry registrations */
  registrations: ts.Statement[];

  /** Component functions */
  components: ts.FunctionDeclaration[];

  /** Transformation errors */
  errors: ITransformError[];

  /** Success status */
  success: boolean;
}
