/**
 * Project-level transformer with dependency resolution
 * Handles component imports and processes files in correct order
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import { createComponentDetector } from './detector/create-component-detector.js';
import { createRecursionDetector } from './detector/create-recursion-detector.js';
import { initializeContext } from './factory.js';
import { createElementGenerator } from './generator/element-generator.js';
import { IComponentDeclaration, ITransformContext, TransformerError } from './types.js';
import { addPulsarImports } from './utils/import-injector.js';
import { createComponentWrapper } from './wrapper/component-wrapper.js';

import type { IComponentDetector } from './detector/component-detector.types.js';
import type { IRecursionDetector } from './detector/recursion-detector.types.js';

/**
 * Project transformation context
 */
export interface IProjectTransformContext {
  /** TypeScript program for the project */
  program: ts.Program;

  /** Root directory of the project */
  rootDir: string;

  /** File paths to transform (.tsx/.jsx files) */
  filePaths: string[];

  /** Component dependency graph */
  dependencyGraph: Map<string, Set<string>>;

  /** Component definitions found in files */
  componentDefinitions: Map<string, ComponentDefinition>;

  /** Processed order of files */
  processOrder: string[];

  /** Debug options */
  debug?: boolean;
}

/**
 * Component definition information
 */
export interface ComponentDefinition {
  /** Component name */
  name: string;

  /** File path where component is defined */
  filePath: string;

  /** Component type (function, arrow, class) */
  type: 'function' | 'arrow' | 'class';

  /** AST node */
  node: ts.Node;

  /** Component dependencies (other components it uses) */
  dependencies: Set<string>;

  /** Whether this component exports JSX */
  exportsJsx: boolean;
}

/**
 * Import resolution result
 */
export interface ImportResolution {
  /** Module path being imported */
  modulePath: string;

  /** Imported names */
  importedNames: string[];

  /** Whether this is a relative import */
  isRelative: boolean;

  /** Whether this is a component import */
  isComponent: boolean;

  /** Resolved file path (for relative imports) */
  resolvedPath?: string;
}

/**
 * Project transformation result
 */
export interface IProjectTransformResult {
  /** Transformed source files */
  transformedFiles: Map<string, ts.SourceFile>;

  /** Dependency graph */
  dependencyGraph: Map<string, Set<string>>;

  /** Processing order used */
  processOrder: string[];

  /** Any errors encountered */
  errors: TransformerError[];
}

/**
 * Main project transformer class
 */
export class ProjectTransformer {
  private context: IProjectTransformContext;
  private typeChecker: ts.TypeChecker;
  private componentDetector: IComponentDetector;
  private recursionDetector: IRecursionDetector;

  constructor(context: IProjectTransformContext) {
    this.context = context;
    this.typeChecker = context.program.getTypeChecker();
    // Create empty detector - will be updated per source file in extractComponentDefinitions
    this.componentDetector = createComponentDetector({
      checker: this.typeChecker,
      debug: context.debug,
    });
    // Create recursion detector to prevent infinite loops
    this.recursionDetector = createRecursionDetector();
  }

  /**
   * Transform entire project with dependency resolution
   */
  async transform(): Promise<IProjectTransformResult> {
    const result: IProjectTransformResult = {
      transformedFiles: new Map(),
      dependencyGraph: new Map(),
      processOrder: [],
      errors: [],
    };

    try {
      // Phase 1: Scan all files for component definitions and imports
      await this.scanComponentDefinitions();

      // Phase 2: Build dependency graph
      await this.buildDependencyGraph();

      // Phase 3: Determine processing order (topological sort)
      this.determineProcessOrder();

      // Phase 4: Transform files in order
      await this.transformFilesInOrder(result);

      // Copy results
      result.dependencyGraph = this.context.dependencyGraph;
      result.processOrder = this.context.processOrder;
    } catch (error) {
      const transformError =
        error instanceof TransformerError
          ? error
          : new TransformerError(
              `Project transformation failed: ${error}`,
              'PROJECT_TRANSFORM_ERROR',
              {
                sourceFile: '',
                line: 0,
                column: 0,
                offset: 0,
                sourceSnippet: '',
                phase: 'validate',
                nodeType: 'unknown',
                nodeKind: 0,
                astPath: [],
                originalCode: '',
              }
            );

      result.errors.push(transformError);
    }

    return result;
  }

  /**
   * Phase 1: Scan all files for component definitions
   */
  private async scanComponentDefinitions(): Promise<void> {
    if (this.context.debug) {
      console.log('[PROJECT_TRANSFORMER] Phase 1: Scanning component definitions...');
    }

    for (const filePath of this.context.filePaths) {
      try {
        const sourceFile = this.context.program.getSourceFile(filePath);
        if (!sourceFile) {
          console.warn(`[PROJECT_TRANSFORMER] Could not get source file: ${filePath}`);
          continue;
        }

        const components = this.extractComponentDefinitions(sourceFile);
        components.forEach((component) => {
          this.context.componentDefinitions.set(component.name, component);
        });

        if (this.context.debug) {
          console.log(
            `[PROJECT_TRANSFORMER] Found ${components.length} components in ${path.basename(filePath)}`
          );
        }
      } catch (error) {
        console.error(`[PROJECT_TRANSFORMER] Error scanning ${filePath}:`, error);
      }
    }
  }

  /**
   * Phase 2: Build dependency graph by analyzing imports
   */
  private async buildDependencyGraph(): Promise<void> {
    if (this.context.debug) {
      console.log('[PROJECT_TRANSFORMER] Phase 2: Building dependency graph...');
    }

    for (const filePath of this.context.filePaths) {
      try {
        const sourceFile = this.context.program.getSourceFile(filePath);
        if (!sourceFile) continue;

        const dependencies = new Set<string>();

        // Analyze imports in this file
        const imports = this.extractImports(sourceFile, filePath);

        for (const importInfo of imports) {
          if (importInfo.isComponent) {
            importInfo.importedNames.forEach((name) => {
              // Only add if it's a component we know about
              if (this.context.componentDefinitions.has(name)) {
                dependencies.add(name);
              }
            });
          }
        }

        this.context.dependencyGraph.set(filePath, dependencies);

        if (this.context.debug && dependencies.size > 0) {
          console.log(
            `[PROJECT_TRANSFORMER] ${path.basename(filePath)} depends on: ${Array.from(dependencies).join(', ')}`
          );
        }
      } catch (error) {
        console.error(`[PROJECT_TRANSFORMER] Error building dependencies for ${filePath}:`, error);
      }
    }
  }

  /**
   * Phase 3: Determine processing order using topological sort
   */
  private determineProcessOrder(): void {
    if (this.context.debug) {
      console.log('[PROJECT_TRANSFORMER] Phase 3: Determining processing order...');
    }

    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (filePath: string): void => {
      if (visiting.has(filePath)) {
        throw new Error(`Circular dependency detected involving: ${filePath}`);
      }

      if (visited.has(filePath)) {
        return;
      }

      visiting.add(filePath);

      const dependencies = this.context.dependencyGraph.get(filePath) || new Set();

      // Visit dependencies first (find files that define the components)
      for (const componentName of dependencies) {
        const componentDef = this.context.componentDefinitions.get(componentName);
        if (componentDef) {
          visit(componentDef.filePath);
        }
      }

      visiting.delete(filePath);
      visited.add(filePath);
      order.push(filePath);
    };

    // Process all files
    for (const filePath of this.context.filePaths) {
      if (!visited.has(filePath)) {
        visit(filePath);
      }
    }

    this.context.processOrder = order;

    if (this.context.debug) {
      console.log('[PROJECT_TRANSFORMER] Processing order:');
      order.forEach((file, index) => {
        console.log(`  ${index + 1}. ${path.basename(file)}`);
      });
    }
  }

  /**
   * Phase 4: Transform files in determined order
   */
  private async transformFilesInOrder(result: IProjectTransformResult): Promise<void> {
    if (this.context.debug) {
      console.log('[PROJECT_TRANSFORMER] Phase 4: Transforming files in order...');
    }

    // Create transformation context
    const transformContext: ts.TransformationContext = {
      getCompilerOptions: () => ts.getDefaultCompilerOptions(),
      startLexicalEnvironment: () => undefined,
      suspendLexicalEnvironment: () => undefined,
      resumeLexicalEnvironment: () => undefined,
      endLexicalEnvironment: () => undefined,
      hoistFunctionDeclaration: () => undefined,
      hoistVariableDeclaration: () => undefined,
      enableSubstitution: () => undefined,
      isSubstitutionEnabled: () => false,
      onSubstituteNode: (hint: ts.EmitHint, node: ts.Node) => node,
      enableEmitNotification: () => undefined,
      isEmitNotificationEnabled: () => false,
      onEmitNode: () => undefined,
      requestEmitHelper: () => undefined,
      readEmitHelpers: () => undefined,
      factory: ts.factory,
    };

    for (const filePath of this.context.processOrder) {
      try {
        const sourceFile = this.context.program.getSourceFile(filePath);
        if (!sourceFile) continue;

        if (this.context.debug) {
          console.log(`[PROJECT_TRANSFORMER] Transforming: ${path.basename(filePath)}`);
        }

        // Use existing single-file transformer
        const transformedFile = this.transformSingleFile(sourceFile, transformContext);
        result.transformedFiles.set(filePath, transformedFile);
      } catch (error) {
        const transformError =
          error instanceof TransformerError
            ? error
            : new TransformerError(
                `Failed to transform ${filePath}: ${error}`,
                'FILE_TRANSFORM_ERROR',
                {
                  sourceFile: filePath,
                  line: 0,
                  column: 0,
                  offset: 0,
                  sourceSnippet: '',
                  phase: 'generate',
                  nodeType: 'unknown',
                  nodeKind: 0,
                  astPath: [],
                  originalCode: '',
                }
              );

        result.errors.push(transformError);
        console.error(`[PROJECT_TRANSFORMER] Error transforming ${filePath}:`, error);
      }
    }
  }

  /**
   * Transform a single file (using existing transformer logic)
   */
  private transformSingleFile(
    sourceFile: ts.SourceFile,
    transformContext: ts.TransformationContext
  ): ts.SourceFile {
    // Initialize transform context
    const context = initializeContext(
      sourceFile,
      sourceFile.fileName,
      this.typeChecker,
      this.context.program
    );

    // Create visitor using existing logic (we'll need to extract this)
    const visitor = this.createVisitor(context);

    // Transform source file
    let result = ts.visitNode(sourceFile, visitor) as ts.SourceFile;

    // Add $REGISTRY import if used
    if (context.requiresRegistry) {
      result = this.addRegistryImport(result);
    }

    return result;
  }

  /**
   * Extract component definitions from a source file
   */
  private extractComponentDefinitions(sourceFile: ts.SourceFile): ComponentDefinition[] {
    const components: ComponentDefinition[] = [];

    // Update detector context for this source file
    this.componentDetector = createComponentDetector({
      checker: this.typeChecker,
      sourceFile: sourceFile,
      debug: this.context.debug,
    });

    const visit = (node: ts.Node): void => {
      // Function declarations: function MyComponent() { ... }
      if (ts.isFunctionDeclaration(node) && node.name) {
        const result = this.componentDetector.detect(node);
        if (result.isComponent) {
          const componentName = node.name.text;
          if (this.context.debug) {
            console.log(
              `[ComponentDetector] ✅ Detected function component: ${componentName} (${result.primaryReason?.strategy}, ${result.confidence})`
            );
          }
          components.push({
            name: componentName,
            filePath: sourceFile.fileName,
            type: 'function',
            node,
            dependencies: new Set(),
            exportsJsx: true,
          });
        }
      }

      // Arrow function components: const MyComponent = () => { ... }
      if (ts.isVariableStatement(node)) {
        const decl = node.declarationList.declarations[0];
        if (decl && ts.isIdentifier(decl.name) && decl.initializer) {
          if (ts.isArrowFunction(decl.initializer)) {
            const result = this.componentDetector.detect(decl.initializer);
            if (result.isComponent) {
              const componentName = decl.name.text;
              if (this.context.debug) {
                console.log(
                  `[ComponentDetector] ✅ Detected arrow component: ${componentName} (${result.primaryReason?.strategy}, ${result.confidence})`
                );
              }
              components.push({
                name: componentName,
                filePath: sourceFile.fileName,
                type: 'arrow',
                node,
                dependencies: new Set(),
                exportsJsx: true,
              });
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return components;
  }

  /**
   * Extract import information from a source file
   */
  private extractImports(sourceFile: ts.SourceFile, filePath: string): ImportResolution[] {
    const imports: ImportResolution[] = [];

    const visit = (node: ts.Node): void => {
      if (
        ts.isImportDeclaration(node) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const modulePath = node.moduleSpecifier.text;
        const isRelative = modulePath.startsWith('./') || modulePath.startsWith('../');

        // Extract imported names
        const importedNames: string[] = [];
        if (node.importClause) {
          // Default import
          if (node.importClause.name) {
            importedNames.push(node.importClause.name.text);
          }

          // Named imports
          if (
            node.importClause.namedBindings &&
            ts.isNamedImports(node.importClause.namedBindings)
          ) {
            node.importClause.namedBindings.elements.forEach((element) => {
              importedNames.push(element.name.text);
            });
          }
        }

        // Check if any imported names are components (start with uppercase)
        const isComponent = importedNames.some((name) => this.isComponentName(name));

        const importInfo: ImportResolution = {
          modulePath,
          importedNames,
          isRelative,
          isComponent,
        };

        // Resolve relative paths
        if (isRelative) {
          try {
            const dir = path.dirname(filePath);
            const resolved = path.resolve(dir, modulePath);
            const withExtension = this.resolveWithExtension(resolved);
            importInfo.resolvedPath = withExtension;
          } catch (error) {
            console.warn(
              `[PROJECT_TRANSFORMER] Could not resolve import: ${modulePath} from ${filePath}`
            );
          }
        }

        imports.push(importInfo);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return imports;
  }

  /**
   * Check if a name follows component naming convention (starts with uppercase)
   */
  private isComponentName(name: string): boolean {
    return /^[A-Z]/.test(name);
  }

  /**
   * Check if function has JSX return
   */
  private hasJsxReturn(node: ts.FunctionDeclaration): boolean {
    if (!node.body) return false;
    return this.hasJsxReturnInBlock(node.body);
  }

  /**
   * Check if arrow function has JSX
   */
  private hasJsxInArrowFunction(node: ts.ArrowFunction): boolean {
    if (ts.isBlock(node.body)) {
      return this.hasJsxReturnInBlock(node.body);
    } else {
      return this.isJsxExpression(node.body);
    }
  }

  /**
   * Check if block has JSX return statement
   */
  private hasJsxReturnInBlock(block: ts.Block): boolean {
    let hasJsx = false;

    const visit = (node: ts.Node): void => {
      if (hasJsx) return;

      if (ts.isReturnStatement(node) && node.expression) {
        if (this.isJsxExpression(node.expression)) {
          hasJsx = true;
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(block);
    return hasJsx;
  }

  /**
   * Check if expression is JSX (handles parenthesized expressions)
   */
  private isJsxExpression(expr: ts.Expression): boolean {
    // Unwrap parenthesized expressions
    let unwrapped = expr;
    while (ts.isParenthesizedExpression(unwrapped)) {
      unwrapped = unwrapped.expression;
    }

    return (
      ts.isJsxElement(unwrapped) ||
      ts.isJsxSelfClosingElement(unwrapped) ||
      ts.isJsxFragment(unwrapped)
    );
  }

  /**
   * Resolve import path with proper extension
   */
  private resolveWithExtension(basePath: string): string {
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];

    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = path.join(basePath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    return basePath; // Return original if not found
  }

  /**
   * Create AST visitor for transformation (using complete transformer logic)
   */
  private createVisitor(context: ITransformContext): (node: ts.Node) => ts.VisitResult<ts.Node> {
    const elementGenerator = createElementGenerator(context);
    const componentWrapper = createComponentWrapper(context);

    const visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      try {
        // Transform JSX elements
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
          return this.transformJsxElement(node, context, elementGenerator);
        }

        // Transform JSX fragments
        if (ts.isJsxFragment(node)) {
          return this.transformJsxFragment(node, context, elementGenerator);
        }

        // Transform function components
        if (this.isFunctionComponent(node)) {
          return this.transformFunctionComponent(node, context, componentWrapper, visitor);
        }

        // Transform arrow function components in variable statements
        if (ts.isVariableStatement(node)) {
          const decl = node.declarationList.declarations[0];
          if (decl && ts.isIdentifier(decl.name)) {
            const isComponent = this.isArrowFunctionComponent(decl);
            if (this.context.debug) {
              console.log(
                `[PROJECT_TRANSFORMER] Checking VariableStatement: ${decl.name.text}, isComponent: ${isComponent}`
              );
            }
            if (isComponent) {
              if (this.context.debug) {
                console.log(`[PROJECT_TRANSFORMER] ✅ Transforming component: ${decl.name.text}`);
              }
              return this.transformArrowFunctionComponentStatement(
                node,
                context,
                componentWrapper,
                visitor
              );
            }
          }
        }

        // Recurse into children - this is CRITICAL for handling all AST nodes properly
        return ts.visitEachChild(node, visitor, undefined);
      } catch (error) {
        // Better error handling (preserve original transformer error patterns)
        if (error instanceof TransformerError) {
          throw error;
        }

        // Import utility functions for proper error context
        const {
          getNodePosition,
          getNodeSnippet,
          getNodeTypeName,
          getASTPath,
        } = require('./utils/ast-utils.js');
        const position = getNodePosition(node, context.sourceFile);
        const snippet = getNodeSnippet(node, context.sourceFile);
        const astPath = getASTPath(node);

        throw new TransformerError(
          `Transformation failed: ${error instanceof Error ? error.message : String(error)}`,
          'PROJECT_TRANSFORM_ERROR',
          {
            sourceFile: context.fileName,
            line: position.line,
            column: position.column,
            offset: position.offset,
            sourceSnippet: snippet,
            phase: 'visit',
            nodeType: getNodeTypeName(node),
            nodeKind: node.kind,
            astPath,
            originalCode: node.getText(context.sourceFile),
          }
        );
      }
    };

    return visitor;
  }

  // Complete transformation methods from main transformer
  private transformJsxElement(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    context: ITransformContext,
    generator: ReturnType<typeof createElementGenerator>
  ): ts.Expression {
    context.jsxDepth++;

    try {
      // Check if this is a component (starts with uppercase) or intrinsic element
      const tagName = ts.isJsxSelfClosingElement(node)
        ? node.tagName.getText()
        : node.openingElement.tagName.getText();

      const isComponent = /^[A-Z]/.test(tagName);

      const generated = isComponent
        ? generator.generateComponent(node)
        : generator.generateElement(node);

      // Mark $REGISTRY as required if we have wires
      if (generated.wires.length > 0) {
        context.requiresRegistry = true;
      }

      // Create IIFE that returns the element (simplified - no wires/events for now)
      const statements = [
        ...generated.statements,
        // TODO: Add wire and event statements back after debugging
        // ...generated.wires.map((wire) => this.createWireStatement(wire)),
        // ...generated.events.map((event) => this.createEventStatement(event)),
        ts.factory.createReturnStatement(ts.factory.createIdentifier(generated.variableName)),
      ];

      return ts.factory.createCallExpression(
        ts.factory.createParenthesizedExpression(
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createBlock(statements, true)
          )
        ),
        undefined,
        []
      );
    } finally {
      context.jsxDepth--;
    }
  }

  private transformJsxFragment(
    node: ts.JsxFragment,
    context: ITransformContext,
    generator: ReturnType<typeof createElementGenerator>
  ): ts.Expression {
    const generated = generator.generateFragment(node);

    const statements = [
      ...generated.statements,
      ts.factory.createReturnStatement(ts.factory.createIdentifier(generated.variableName)),
    ];

    return ts.factory.createCallExpression(
      ts.factory.createParenthesizedExpression(
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createBlock(statements, true)
        )
      ),
      undefined,
      []
    );
  }

  private transformFunctionComponent(
    node: ts.FunctionDeclaration,
    context: ITransformContext,
    wrapper: ReturnType<typeof createComponentWrapper>,
    visitor: (node: ts.Node) => ts.VisitResult<ts.Node>
  ): ts.Statement {
    if (!node.name) return node;

    const componentName = node.name.text;

    // Check for self-recursion BEFORE entering component
    if (this.recursionDetector.checkRecursion(componentName)) {
      const callStack = this.recursionDetector.getCallStack();
      throw new TransformerError(
        `Self-recursion detected in component "${componentName}"! Component tries to render itself, which would cause an infinite loop.\n` +
          `Call stack: ${callStack.join(' -> ')} -> ${componentName}\n` +
          `Fix: Components cannot render themselves. Use conditional rendering or child components instead.`,
        'SELF_RECURSION_DETECTED',
        {
          sourceFile: context.fileName,
          line: node.getStart(context.sourceFile),
          column: 0,
          offset: node.getStart(context.sourceFile),
          sourceSnippet: node.getText(context.sourceFile).substring(0, 100),
          phase: 'validate',
          nodeType: 'FunctionDeclaration',
          nodeKind: node.kind,
          astPath: [],
          originalCode: node.getText(context.sourceFile),
        }
      );
    }

    // Enter component scope
    this.recursionDetector.enterComponent(componentName);
    context.currentComponent = componentName;

    try {
      // First visit the body to transform any JSX
      const transformedNode = ts.visitEachChild(node, visitor, undefined) as ts.FunctionDeclaration;

      // Extract body statements
      const bodyStatements = transformedNode.body
        ? Array.from(transformedNode.body.statements)
        : [];

      // Create component declaration
      const declaration: IComponentDeclaration = {
        name: componentName,
        node: transformedNode,
        parameters: Array.from(transformedNode.parameters),
        returnType: transformedNode.type,
        body: bodyStatements,
      };

      // Wrap in $REGISTRY.execute
      return wrapper.wrapComponent(declaration);
    } finally {
      // Exit component scope
      this.recursionDetector.exitComponent(componentName);
      context.currentComponent = null;
    }
  }

  private transformArrowFunctionComponentStatement(
    node: ts.VariableStatement,
    context: ITransformContext,
    wrapper: ReturnType<typeof createComponentWrapper>,
    visitor: (node: ts.Node) => ts.VisitResult<ts.Node>
  ): ts.Statement {
    const decl = node.declarationList.declarations[0];

    if (!ts.isIdentifier(decl.name)) return node;
    if (!decl.initializer || !ts.isArrowFunction(decl.initializer)) return node;

    const componentName = decl.name.text;

    // Check for self-recursion BEFORE entering component
    if (this.recursionDetector.checkRecursion(componentName)) {
      const callStack = this.recursionDetector.getCallStack();
      throw new TransformerError(
        `Self-recursion detected in component "${componentName}"! Component tries to render itself, which would cause an infinite loop.\n` +
          `Call stack: ${callStack.join(' -> ')} -> ${componentName}\n` +
          `Fix: Components cannot render themselves. Use conditional rendering or child components instead.`,
        'SELF_RECURSION_DETECTED',
        {
          sourceFile: context.fileName,
          line: node.getStart(context.sourceFile),
          column: 0,
          offset: node.getStart(context.sourceFile),
          sourceSnippet: node.getText(context.sourceFile).substring(0, 100),
          phase: 'validate',
          nodeType: 'VariableStatement',
          nodeKind: node.kind,
          astPath: [],
          originalCode: node.getText(context.sourceFile),
        }
      );
    }

    // Enter component scope
    this.recursionDetector.enterComponent(componentName);
    context.currentComponent = componentName;

    try {
      // Visit arrow function body
      const transformedArrow = ts.visitNode(decl.initializer, visitor) as ts.ArrowFunction;

      // Extract body
      let bodyStatements: ts.Statement[];
      if (ts.isBlock(transformedArrow.body)) {
        bodyStatements = Array.from(transformedArrow.body.statements);
      } else {
        bodyStatements = [ts.factory.createReturnStatement(transformedArrow.body)];
      }

      // Create component declaration
      const declaration: IComponentDeclaration = {
        name: componentName,
        node: decl,
        parameters: Array.from(transformedArrow.parameters),
        returnType: transformedArrow.type,
        body: bodyStatements,
      };

      // Wrap in $REGISTRY.execute and preserve modifiers
      const wrappedDecl = wrapper.wrapComponent(declaration);

      // If the wrapped result is a VariableStatement, add original modifiers
      if (ts.isVariableStatement(wrappedDecl)) {
        return ts.factory.updateVariableStatement(
          wrappedDecl,
          node.modifiers, // Preserve export, etc
          wrappedDecl.declarationList
        );
      }

      return wrappedDecl;
    } finally {
      // Exit component scope
      this.recursionDetector.exitComponent(componentName);
      context.currentComponent = null;
    }
  }

  private isFunctionComponent(node: ts.Node): node is ts.FunctionDeclaration {
    if (!ts.isFunctionDeclaration(node)) return false;
    if (!node.name) return false;
    if (!node.body) return false;

    // Use ComponentDetector for detection
    const result = this.componentDetector.detect(node);
    return result.isComponent;
  }

  private isArrowFunctionComponent(node: ts.Node): node is ts.VariableDeclaration {
    if (!ts.isVariableDeclaration(node)) return false;
    if (!ts.isIdentifier(node.name)) return false;
    if (!node.initializer) return false;

    const isArrow = ts.isArrowFunction(node.initializer);
    if (!isArrow) return false;

    // Use ComponentDetector for detection
    const result = this.componentDetector.detect(node.initializer);
    return result.isComponent;
  }

  private createWireStatement(wire: any): ts.Statement {
    return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('$REGISTRY'),
          ts.factory.createIdentifier('wire')
        ),
        undefined,
        [
          ts.factory.createIdentifier(wire.element),
          ts.factory.createStringLiteral(wire.property),
          wire.getter,
        ]
      )
    );
  }

  private createEventStatement(event: any): ts.Statement {
    return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('$REGISTRY'),
          ts.factory.createIdentifier('event')
        ),
        undefined,
        [
          ts.factory.createIdentifier(event.element),
          ts.factory.createStringLiteral(event.type),
          event.handler,
        ]
      )
    );
  }

  /**
   * Add $REGISTRY and t_element imports to source file if not already present
   * Delegates to shared utility to avoid code duplication
   */
  private addRegistryImport(sourceFile: ts.SourceFile): ts.SourceFile {
    return addPulsarImports(sourceFile);
  }
}

/**
 * Create a project transformer for the given context
 */
export function createProjectTransformer(context: IProjectTransformContext): ProjectTransformer {
  return new ProjectTransformer(context);
}

/**
 * Utility function to get all TSX/JSX files in a directory
 */
export function getAllComponentFiles(rootDir: string): string[] {
  const files: string[] = [];

  const scan = (dir: string): void => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and other common excludes
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
            scan(fullPath);
          }
        } else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`[PROJECT_TRANSFORMER] Could not scan directory: ${dir}`);
    }
  };

  scan(rootDir);
  return files;
}
