import * as ts from 'typescript';
// TODO: Incomplete implementations - temporarily disabled
// import { checkCircularDependencies, validateInjectCalls } from './compiler-api/di-integration.js'
// import { validateJSXProps } from './compiler-api/prop-validation.js'
// import { analyzeRouteComponent, validateUseParamsCall } from './compiler-api/route-integration.js'
import type { IRegistryTransformConfig } from './config/registry-config.js';
import { TransformationContext } from './context/index.js';
import { ElementGenerator } from './generator/element-generator/index.js';
import { addRegistryImports, needsRegistryTransformation } from './generator/registry-imports.js';
import { optimize } from './optimizer/index.js';
import { isComponentDefinition } from './parser/component-detector.js';
import { JSXAnalyzer } from './parser/jsx-analyzer/index.js';

// Export configuration types
export { DEFAULT_REGISTRY_CONFIG } from './config/registry-config.js';
export type { IRegistryTransformConfig } from './config/registry-config.js';

/**
 * Main TypeScript transformer for pulsar
 * Transforms JSX syntax into direct DOM manipulation with reactive updates
 *
 * Usage in ttypescript:
 * {
 *   "compilerOptions": {
 *     "plugins": [
 *       { "transform": "@pulsar/transformer" }
 *     ]
 *   }
 * }
 *
 * Configuration options:
 * {
 *   "compilerOptions": {
 *     "plugins": [
 *       {
 *         "transform": "@pulsar/transformer",
 *         "optimize": true,
 *         "optimizerConfig": {
 *           "constantFolding": true,
 *           "deadCodeElimination": true,
 *           "bundleWarnings": true,
 *           "verbose": false
 *         }
 *       }
 *     ]
 *   }
 * }
 */
export default function visualSchemaTransformer(
  program: ts.Program,
  config?: IRegistryTransformConfig
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
    // Create transformation context
    const transformContext = new TransformationContext(program, sourceFile, context);

    // Create analyzer and generator
    const analyzer = new JSXAnalyzer(transformContext);
    const generator = new ElementGenerator(transformContext);

    // Collect diagnostics from compiler API integrations
    const diagnostics: ts.Diagnostic[] = [];

    // TODO: Incomplete implementations - temporarily disabled
    // Run DI validation (once per file)
    // const diDiagnostics = validateInjectCalls(sourceFile, transformContext)
    // diagnostics.push(...diDiagnostics)

    // const circularDeps = checkCircularDependencies(sourceFile, transformContext)
    // diagnostics.push(...circularDeps)

    // Track if we've found any components
    let foundComponents = false;

    // Custom recursive visitor that transforms JSX at ANY nesting level
    // Strategy: For components, visit children to transform JSX in their bodies
    // For regular JSX, transform immediately
    //
    // IMPORTANT: Detects component definitions and transforms JSX inside their bodies
    // This ensures components that return JSX work correctly
    const transformVisitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      // Check if this is a component definition (VariableDeclaration or FunctionDeclaration)
      // If so, visit its children to transform JSX inside the function body
      if (isComponentDefinition(node)) {
        // Component detected - transformation will be applied to JSX children
        // Don't transform the component node itself, but DO visit its children
        // This allows JSX inside the component body to be transformed
        return ts.visitEachChild(node, transformVisitor, context);
      }

      // Transform JSX nodes - the analyzer recursively analyzes nested JSX
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
        try {
          // TODO: Incomplete implementations - temporarily disabled
          // Run compiler API validations before transformation
          // if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
          //     // Validate JSX props
          //     const propDiagnostics = validateJSXProps(node, transformContext)
          //     diagnostics.push(...propDiagnostics)
          //
          //     // Validate Route components
          //     const routeInfo = analyzeRouteComponent(node, transformContext)
          //     if (routeInfo) {
          //         // Could add route-specific validation here
          //     }
          // }

          const elementIR = analyzer.analyze(node);
          if (!elementIR) {
            return node; // Return original node if analysis fails
          }
          const generatedCode = generator.generate(elementIR);
          return generatedCode;
        } catch (error) {
          console.error('Error transforming JSX:', error);
          return node;
        }
      }

      // TODO: Incomplete implementation - temporarily disabled
      // Validate useParams() calls
      // if (ts.isCallExpression(node)) {
      //     if (ts.isIdentifier(node.expression) && node.expression.text === 'useParams') {
      //         const paramsDiagnostics = validateUseParamsCall(node, transformContext)
      //         diagnostics.push(...paramsDiagnostics)
      //     }
      // }

      // For all other nodes, visit children to find nested JSX
      // Note: JsxExpression nodes are handled by the analyzer, not here
      return ts.visitEachChild(node, transformVisitor, context);
    };

    // Make the visitor available to the generator through the context
    transformContext.jsxVisitor = transformVisitor;

    // Apply transformation to the entire source file
    let transformed = ts.visitEachChild(sourceFile, transformVisitor, context) as ts.SourceFile;

    // Apply optimizations if enabled
    if (config?.optimize) {
      const typeChecker = program.getTypeChecker();
      const optimizationResult = optimize(
        transformed,
        typeChecker,
        context,
        config.optimizerConfig
      );
      transformed = optimizationResult.sourceFile;

      // Optimization report is handled by the optimization reporter if verbose is enabled
    }

    // Report diagnostics if any
    if (diagnostics.length > 0) {
      // Log diagnostics for development
      diagnostics.forEach((diag) => {
        if (diag.file && diag.start !== undefined) {
          const { line, character } = ts.getLineAndCharacterOfPosition(diag.file, diag.start);
          const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
          console.warn(`${diag.file.fileName} (${line + 1},${character + 1}): ${message}`);
        }
      });
    }

    // Add necessary runtime imports at the top of the file
    // Check if we need to add imports (if file contains transformed JSX)
    const needsRegistry =
      config?.enableRegistry !== false && needsRegistryTransformation(sourceFile);

    if (needsRegistry) {
      // Add registry imports first
      transformed = addRegistryImports(transformed);
    }

    const hasJSX = sourceFile.getText().includes('return (') || sourceFile.getText().includes('<');

    if (hasJSX) {
      // Create import declarations for runtime helpers
      const runtimeImports = [
        ts.factory.createImportDeclaration(
          undefined,
          ts.factory.createImportClause(
            false,
            undefined,
            ts.factory.createNamedImports([
              ts.factory.createImportSpecifier(
                false,
                undefined,
                ts.factory.createIdentifier('createEffect')
              ),
              ts.factory.createImportSpecifier(
                false,
                undefined,
                ts.factory.createIdentifier('createMemo')
              ),
              ts.factory.createImportSpecifier(
                false,
                undefined,
                ts.factory.createIdentifier('createSignal')
              ),
            ])
          ),
          ts.factory.createStringLiteral('@pulsar-framework/pulsar.dev/hooks')
        ),
      ];

      // Add imports to the beginning of the file
      transformed = ts.factory.updateSourceFile(
        transformed,
        [...runtimeImports, ...transformed.statements],
        transformed.isDeclarationFile,
        transformed.referencedFiles,
        transformed.typeReferenceDirectives,
        transformed.hasNoDefaultLib,
        transformed.libReferenceDirectives
      );
    }

    return transformed;
  };
}

/**
 * Transformer factory for ttypescript
 */
export function transform(program: ts.Program) {
  return visualSchemaTransformer(program);
}
