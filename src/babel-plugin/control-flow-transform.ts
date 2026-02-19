/**
 * Control Flow Transformation for Pulsar
 * Transforms control flow components to JavaScript expressions
 *
 * Transformations:
 * - <Show when={condition}>{children}</Show> → condition ? children : null
 * - <Show when={condition} fallback={<div/>}>{children}</Show> → condition ? children : fallback
 * - <ShowRegistry when={condition}>{children}</ShowRegistry> → ShowRegistry({ fallback: () => null, children: () => children })
 * - <For each={items}>{item => <div/>}</For> → items().map(item => ...)
 * - <ForRegistry each={items}>{item => <div/>}</ForRegistry> → ForRegistry({ fallback: () => null, children: (item, index) => children })
 * - <Index each={items}>{item => <div/>}</Index> → Index({ fallback: () => null, children: (item, index) => children })
 * - <Switch fallback={<div/>}><Match when={x}>{content}</Match></Switch> → ternary chain
 *
 * Compiler-sugar auto-transforms (JSXExpressionContainer):
 * - {signal().map(cb)}            → ForRegistry({ each: () => signal(), children: cb })
 * - {cond() ? <A/> : <B/>}       → ShowRegistry({ when: cond, children: () => <A/>, fallback: () => <B/> })
 * - {cond() && <A/>}             → ShowRegistry({ when: cond, children: () => <A/>, fallback: () => null })
 *
 * JSX boundary element:
 * - <boundary fallback={<F/>}>{children}</boundary> → Tryer({ fallback: (_e,_r) => <F/>, children: () => children })
 */

import type { NodePath } from '@babel/traverse'
import type * as BabelTypes from '@babel/types'
import { addImport } from './jsx-transform/add-import.js'
import { needsReactiveWrapper } from './needs-reactive-wrapper.js'

export function createControlFlowTransform(t: typeof BabelTypes) {
  // Program path set once by the plugin before traversal so transforms
  // can call addImport() to auto-inject required specifiers.
  let _program: NodePath<BabelTypes.Program> | null = null;

  return {
    /** Called by the plugin's Program.enter before the second pass traversal. */
    setProgram(path: NodePath<BabelTypes.Program>): void {
      _program = path;
    },

    JSXElement(path: NodePath<BabelTypes.JSXElement>) {
      const openingElement = path.node.openingElement;
      const tagName = getJSXElementName(openingElement.name, t);

      if (!tagName) return;

      // Handle <Show> — route through the same reactive runtime path as ShowRegistry.
      // <Show> is commonly used as an import alias for ShowRegistry, so it must produce
      // a ShowRegistry({when, children: () => ...}) call (reactive), NOT a static ternary.
      // We preserve the original tag identifier so the call matches whatever the user imported.
      if (tagName === 'Show') {
        transformShowRegistry(path, t, 'Show');
        return;
      }

      // Handle <ShowRegistry> (runtime component with lazy children)
      if (tagName === 'ShowRegistry') {
        transformShowRegistry(path, t);
        return;
      }

      // Handle <For> — commonly used as import alias for ForRegistry.
      // Routes to the reactive runtime path so that signal-backed arrays
      // (e.g. tasks()) subscribe to changes and the DOM updates on setTasks().
      // We preserve the original tag identifier so the call matches the import alias.
      if (tagName === 'For') {
        transformRegistryList(path, t, 'For');
        return;
      }

      // Handle <ForRegistry> (runtime component)
      if (tagName === 'ForRegistry') {
        transformForRegistry(path, t);
        return;
      }

      // Handle <Index> (runtime component)
      if (tagName === 'Index') {
        transformIndex(path, t);
        return;
      }

      // Handle <Switch> / <SwitchRegistry>
      if (tagName === 'Switch' || tagName === 'SwitchRegistry') {
        transformSwitch(path, t);
        return;
      }

      // Handle <boundary fallback={...}>{children}</boundary>
      // Compiler sugar for Tryer error-boundary component.
      if (tagName === 'boundary') {
        transformBoundary(path, t, _program);
        return;
      }
    },

    /**
     * Compiler-sugar transforms inside JSX expression slots:
     *   {signal().map(cb)}       → ForRegistry
     *   {cond() ? <A/> : <B/>}  → ShowRegistry
     *   {cond() && <A/>}        → ShowRegistry
     */
    JSXExpressionContainer(path: NodePath<BabelTypes.JSXExpressionContainer>) {
      if (tryTransformMapToForRegistry(path, t, _program)) return;
      if (tryTransformTernaryToShowRegistry(path, t, _program)) return;
      tryTransformAndToShowRegistry(path, t, _program);
    },
  };
}

/**
 * Transform <Show when={condition} fallback={fallback}>{children}</Show>
 * To: condition ? children : (fallback || null)
 */
function transformShow(path: NodePath<BabelTypes.JSXElement>, t: typeof BabelTypes) {
  const openingElement = path.node.openingElement;
  const attributes = openingElement.attributes;

  // Extract "when" attribute
  const whenAttr = attributes.find(
    (attr): attr is BabelTypes.JSXAttribute =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'when'
  );

  if (!whenAttr || !whenAttr.value) {
    // No when attribute - leave as is
    return;
  }

  // Extract condition expression
  let condition: BabelTypes.Expression;
  if (t.isJSXExpressionContainer(whenAttr.value)) {
    condition = whenAttr.value.expression as BabelTypes.Expression;
  } else {
    // Literal value
    return;
  }

  // Extract "fallback" attribute
  const fallbackAttr = attributes.find(
    (attr): attr is BabelTypes.JSXAttribute =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'fallback'
  );

  let fallback: BabelTypes.Expression = t.nullLiteral();
  if (fallbackAttr && fallbackAttr.value && t.isJSXExpressionContainer(fallbackAttr.value)) {
    fallback = fallbackAttr.value.expression as BabelTypes.Expression;
  }

  // Extract children
  const children = path.node.children;
  let consequent: BabelTypes.Expression;

  if (children.length === 0) {
    consequent = t.nullLiteral();
  } else if (children.length === 1) {
    const child = children[0];
    if (t.isJSXElement(child) || t.isJSXFragment(child)) {
      consequent = child as any;
    } else if (t.isJSXExpressionContainer(child)) {
      consequent = child.expression as BabelTypes.Expression;
    } else {
      consequent = t.nullLiteral();
    }
  } else {
    // Multiple children - wrap in fragment or array
    consequent = t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), children as any[]);
  }

  // Create ternary: condition ? consequent : fallback
  const ternary = t.conditionalExpression(condition, consequent, fallback);

  // Replace the entire <Show> element with the ternary
  path.replaceWith(ternary as any);
}

/**
 * Transform <ShowRegistry when={condition} fallback={fallback}>{children}</ShowRegistry>
 * To: ShowRegistry({ when: condition, fallback: () => fallback, children: () => children })
 *
 * Also used for <Show> (same logic, different emitted identifier so it matches the import alias).
 */
function transformShowRegistry(
  path: NodePath<BabelTypes.JSXElement>,
  t: typeof BabelTypes,
  componentName = 'ShowRegistry'
) {
  const openingElement = path.node.openingElement;
  const attributes = openingElement.attributes;

  const props: BabelTypes.ObjectProperty[] = [];

  // Extract attributes
  for (const attr of attributes) {
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
      const name = attr.name.name;

      // Handle "when"
      if (name === 'when') {
        if (attr.value && t.isJSXExpressionContainer(attr.value)) {
          let whenExpr = attr.value.expression as BabelTypes.Expression;

          const isAlreadyFunction =
            t.isArrowFunctionExpression(whenExpr) || t.isFunctionExpression(whenExpr);
          const isIdentifier = t.isIdentifier(whenExpr);
          const isSimpleGetter =
            t.isCallExpression(whenExpr) &&
            (whenExpr as BabelTypes.CallExpression).arguments.length === 0 &&
            t.isIdentifier((whenExpr as BabelTypes.CallExpression).callee);

          if (isAlreadyFunction || isIdentifier) {
            // Already lazy — pass as-is
          } else if (isSimpleGetter) {
            // Unwrap zero-arg signal getter: isOpen() → isOpen
            whenExpr = (whenExpr as BabelTypes.CallExpression).callee as BabelTypes.Identifier;
          } else {
            // Complex expression (binary, logical, member, etc.) — wrap in arrow so it
            // evaluates lazily inside the wire callback and subscribes to signals it reads:
            // activeTooltip() === 'button1'  →  () => activeTooltip() === 'button1'
            whenExpr = t.arrowFunctionExpression([], whenExpr);
          }

          props.push(t.objectProperty(t.identifier('when'), whenExpr));
        }
        continue;
      }

      // Handle "fallback" - Wrap in arrow function if not already
      if (name === 'fallback') {
        let fallbackExpr: BabelTypes.Expression = t.nullLiteral();

        if (attr.value && t.isJSXExpressionContainer(attr.value)) {
          fallbackExpr = attr.value.expression as BabelTypes.Expression;
        } else if (t.isStringLiteral(attr.value)) {
          fallbackExpr = attr.value;
        }

        // Check if already a function
        const isFunc =
          t.isArrowFunctionExpression(fallbackExpr) || t.isFunctionExpression(fallbackExpr);

        props.push(
          t.objectProperty(
            t.identifier('fallback'),
            isFunc ? fallbackExpr : t.arrowFunctionExpression([], fallbackExpr)
          )
        );
        continue;
      }

      // Other props - pass through
      if (attr.value) {
        let value: BabelTypes.Expression;
        if (t.isJSXExpressionContainer(attr.value)) {
          value = attr.value.expression as BabelTypes.Expression;
        } else if (t.isStringLiteral(attr.value)) {
          value = attr.value;
        } else {
          value = t.booleanLiteral(true);
        }
        props.push(t.objectProperty(t.identifier(name), value));
      }
    }
  }

  // Handle Children - Wrap in arrow function if not already
  const children = path.node.children.filter(
    (child) => !t.isJSXText(child) || child.value.trim() !== ''
  );

  let childrenExpr: BabelTypes.Expression;

  if (children.length === 0) {
    childrenExpr = t.arrowFunctionExpression([], t.nullLiteral());
  } else if (children.length === 1) {
    const child = children[0];
    if (t.isJSXExpressionContainer(child)) {
      // Check if expression inside is a function
      const inner = child.expression as BabelTypes.Expression;
      if (t.isArrowFunctionExpression(inner) || t.isFunctionExpression(inner)) {
        childrenExpr = inner; // Already wrapped!
      } else {
        childrenExpr = t.arrowFunctionExpression([], inner); // Wrap expression
      }
    } else if (t.isJSXElement(child) || t.isJSXFragment(child)) {
      childrenExpr = t.arrowFunctionExpression([], child as any); // Wrap element
    } else {
      // Literal text etc.
      childrenExpr = t.arrowFunctionExpression([], t.nullLiteral());
    }
  } else {
    // Multiple children -> Fragment wrapped in arrow function
    const fragment = t.jsxFragment(
      t.jsxOpeningFragment(),
      t.jsxClosingFragment(),
      children as any[]
    );
    childrenExpr = t.arrowFunctionExpression([], fragment as any);
  }

  props.push(t.objectProperty(t.identifier('children'), childrenExpr));

  const componentCall = t.callExpression(t.identifier(componentName), [t.objectExpression(props)]);
  path.replaceWith(componentCall);
}

/**
 * Transform <For each={items()}>{(item, index) => <div>{item}</div>}</For>
 * To: items().map((item, index) => <div>{item}</div>)
 */
function transformFor(path: NodePath<BabelTypes.JSXElement>, t: typeof BabelTypes) {
  const openingElement = path.node.openingElement;
  const attributes = openingElement.attributes;

  // Extract "each" attribute
  const eachAttr = attributes.find(
    (attr): attr is BabelTypes.JSXAttribute =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'each'
  );

  if (!eachAttr || !eachAttr.value) {
    return;
  }

  // Extract array expression
  let arrayExpr: BabelTypes.Expression;
  if (t.isJSXExpressionContainer(eachAttr.value)) {
    arrayExpr = eachAttr.value.expression as BabelTypes.Expression;
  } else {
    return;
  }

  // Extract children (should be a function expression)
  const children = path.node.children;
  if (children.length === 0) {
    path.replaceWith(t.arrayExpression([]));
    return;
  }

  // Find first non-whitespace child - it should be the callback function
  const nonTextChildren = children.filter((child) => !t.isJSXText(child) || child.value.trim());

  if (nonTextChildren.length === 0) {
    path.replaceWith(t.arrayExpression([]));
    return;
  }

  const firstChild = nonTextChildren[0];
  let callback: BabelTypes.Expression;

  if (t.isJSXExpressionContainer(firstChild)) {
    const expr = firstChild.expression;
    // Check if it's already a function (arrow or regular)
    if (t.isArrowFunctionExpression(expr) || t.isFunctionExpression(expr)) {
      // Use the function directly - it already has parameters
      callback = expr as BabelTypes.Expression;
    } else if (t.isExpression(expr)) {
      // It's an expression, wrap in arrow function
      const itemParam = t.identifier('item');
      callback = t.arrowFunctionExpression([itemParam], expr);
    } else {
      // Fallback - empty array
      path.replaceWith(t.arrayExpression([]));
      return;
    }
  } else {
    // If not a function, wrap children in arrow function
    // (item) => children
    const itemParam = t.identifier('item');
    const childrenArray = nonTextChildren as any[];

    if (childrenArray.length === 1) {
      const child = childrenArray[0];
      // Unwrap JSXExpressionContainer if needed
      const body = t.isJSXExpressionContainer(child) ? child.expression : child;
      callback = t.arrowFunctionExpression([itemParam], body);
    } else {
      callback = t.arrowFunctionExpression(
        [itemParam],
        t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), childrenArray)
      );
    }
  }

  // If `each` is a function (arrow or regular), call it first to get the array.
  // e.g. each={() => columns}  → resolvedArray = (() => columns)()  → columns.map(...)
  //      each={items()}        → already an array expression, use as-is
  const isEachFunction =
    t.isArrowFunctionExpression(arrayExpr) || t.isFunctionExpression(arrayExpr);

  const resolvedArray = isEachFunction ? t.callExpression(arrayExpr, []) : arrayExpr;

  // Create: resolvedArray.map(callback)
  const mapCall = t.callExpression(t.memberExpression(resolvedArray, t.identifier('map')), [
    callback,
  ]);

  path.replaceWith(mapCall as any);
}

/**
 * Common logic for ForRegistry and Index transformations
 */
function transformRegistryList(
  path: NodePath<BabelTypes.JSXElement>,
  t: typeof BabelTypes,
  componentName: string
) {
  const openingElement = path.node.openingElement;
  const attributes = openingElement.attributes;
  const props: BabelTypes.ObjectProperty[] = [];

  for (const attr of attributes) {
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
      const name = attr.name.name;

      // Handle "fallback" - Wrap in arrow function
      if (name === 'fallback') {
        let fallbackExpr: BabelTypes.Expression = t.nullLiteral();
        if (attr.value && t.isJSXExpressionContainer(attr.value)) {
          fallbackExpr = attr.value.expression as BabelTypes.Expression;
        } else if (t.isStringLiteral(attr.value)) {
          fallbackExpr = attr.value;
        }

        const isFunc =
          t.isArrowFunctionExpression(fallbackExpr) || t.isFunctionExpression(fallbackExpr);
        props.push(
          t.objectProperty(
            t.identifier('fallback'),
            isFunc ? fallbackExpr : t.arrowFunctionExpression([], fallbackExpr)
          )
        );
        continue;
      }

      // Other props - wrap reactive expressions for "each" attribute
      if (attr.value) {
        let value: BabelTypes.Expression;
        if (t.isJSXExpressionContainer(attr.value)) {
          const expr = attr.value.expression as BabelTypes.Expression;

          // Special handling for "each" attribute - wrap in arrow function for reactivity
          if (name === 'each') {
            // Check if already a function
            const isFunc = t.isArrowFunctionExpression(expr) || t.isFunctionExpression(expr);
            value = isFunc ? expr : t.arrowFunctionExpression([], expr);
          } else {
            value = expr;
          }
        } else if (t.isStringLiteral(attr.value)) {
          value = attr.value;
        } else {
          value = t.booleanLiteral(true);
        }
        props.push(t.objectProperty(t.identifier(name), value));
      }
    }
  }

  // Handle Children - Expecting function
  const children = path.node.children.filter(
    (child) => !t.isJSXText(child) || child.value.trim() !== ''
  );

  let childrenExpr: BabelTypes.Expression;
  if (children.length > 0) {
    const firstChild = children[0];
    if (t.isJSXExpressionContainer(firstChild) && firstChild.expression) {
      childrenExpr = firstChild.expression as BabelTypes.Expression;
      // Assume user provided valid function (item, index) => ...
    } else {
      // Wrap static content? (item, index) => ...
      // This is risky but consistent with wrapping logic
      const itemParam = t.identifier('item');
      const indexParam = t.identifier('index');

      let body: BabelTypes.Expression;
      if (children.length === 1) {
        const child = children[0];
        body = t.isJSXElement(child) || t.isJSXFragment(child) ? (child as any) : t.nullLiteral();
      } else {
        body = t.jsxFragment(
          t.jsxOpeningFragment(),
          t.jsxClosingFragment(),
          children as any[]
        ) as any;
      }

      childrenExpr = t.arrowFunctionExpression([itemParam, indexParam], body);
    }
    props.push(t.objectProperty(t.identifier('children'), childrenExpr));
  }

  const callExpr = t.callExpression(t.identifier(componentName), [t.objectExpression(props)]);
  path.replaceWith(callExpr);
}

function transformForRegistry(path: NodePath<BabelTypes.JSXElement>, t: typeof BabelTypes) {
  transformRegistryList(path, t, 'ForRegistry');
}

function transformIndex(path: NodePath<BabelTypes.JSXElement>, t: typeof BabelTypes) {
  transformRegistryList(path, t, 'Index');
}

/**
 * Transform <Switch> to nested ternaries
 * <Switch fallback={<div>Default</div>}>
 *   <Match when={x === 1}><div>One</div></Match>
 *   <Match when={x === 2}><div>Two</div></Match>
 * </Switch>
 *
 * To: x === 1 ? <div>One</div> : x === 2 ? <div>Two</div> : <div>Default</div>
 */
function transformSwitch(path: NodePath<BabelTypes.JSXElement>, t: typeof BabelTypes) {
  const openingElement = path.node.openingElement;
  const attributes = openingElement.attributes;

  // Extract fallback
  const fallbackAttr = attributes.find(
    (attr): attr is BabelTypes.JSXAttribute =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'fallback'
  );

  let fallback: BabelTypes.Expression = t.nullLiteral();
  if (fallbackAttr && fallbackAttr.value && t.isJSXExpressionContainer(fallbackAttr.value)) {
    fallback = fallbackAttr.value.expression as BabelTypes.Expression;
  }

  // Extract <Match> children
  const children = path.node.children;
  const matches: Array<{ condition: BabelTypes.Expression; content: BabelTypes.Expression }> = [];

  for (const child of children) {
    if (t.isJSXElement(child)) {
      const childTagName = getJSXElementName(child.openingElement.name, t);
      if (childTagName === 'Match' || childTagName === 'MatchRegistry') {
        // Extract when condition
        const whenAttr = child.openingElement.attributes.find(
          (attr): attr is BabelTypes.JSXAttribute =>
            t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'when'
        );

        if (whenAttr && whenAttr.value && t.isJSXExpressionContainer(whenAttr.value)) {
          const condition = whenAttr.value.expression as BabelTypes.Expression;

          // Extract Match content
          let content: BabelTypes.Expression;
          if (child.children.length === 1) {
            const matchChild = child.children[0];
            if (t.isJSXElement(matchChild) || t.isJSXFragment(matchChild)) {
              content = matchChild as any;
            } else if (t.isJSXExpressionContainer(matchChild)) {
              content = matchChild.expression as BabelTypes.Expression;
            } else {
              content = t.nullLiteral();
            }
          } else {
            content = t.jsxFragment(
              t.jsxOpeningFragment(),
              t.jsxClosingFragment(),
              child.children as any[]
            );
          }

          matches.push({ condition, content });
        }
      }
    }
  }

  // Build nested ternary from right to left
  let result: BabelTypes.Expression = fallback;
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    result = t.conditionalExpression(match.condition, match.content, result);
  }

  path.replaceWith(result as any);
}

// ---------------------------------------------------------------------------
// New compiler-sugar helpers
// ---------------------------------------------------------------------------

/**
 * <boundary fallback={<Fallback/>}>{children}</boundary>
 * → Tryer({ fallback: (_error, _reset) => <Fallback/>, children: () => children })
 *
 * fallback can also be a function already: (error, reset) => <Fallback error={error}/>
 */
function transformBoundary(
  path: NodePath<BabelTypes.JSXElement>,
  t: typeof BabelTypes,
  program: NodePath<BabelTypes.Program> | null
): void {
  const attrs = path.node.openingElement.attributes;
  const props: BabelTypes.ObjectProperty[] = [];

  // Extract fallback
  const fallbackAttr = attrs.find(
    (a): a is BabelTypes.JSXAttribute =>
      t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === 'fallback'
  );

  if (fallbackAttr?.value) {
    let fbExpr: BabelTypes.Expression = t.nullLiteral();
    if (t.isJSXExpressionContainer(fallbackAttr.value)) {
      fbExpr = fallbackAttr.value.expression as BabelTypes.Expression;
    }
    const isFunc = t.isArrowFunctionExpression(fbExpr) || t.isFunctionExpression(fbExpr);
    props.push(
      t.objectProperty(
        t.identifier('fallback'),
        isFunc
          ? fbExpr
          : t.arrowFunctionExpression(
              [t.identifier('_error'), t.identifier('_reset')],
              fbExpr
            )
      )
    );
  }

  // Extract children
  const rawChildren = path.node.children.filter(
    (c) => !t.isJSXText(c) || (c as BabelTypes.JSXText).value.trim() !== ''
  );

  let childrenExpr: BabelTypes.Expression;
  if (rawChildren.length === 0) {
    childrenExpr = t.arrowFunctionExpression([], t.nullLiteral());
  } else if (rawChildren.length === 1) {
    const c = rawChildren[0];
    if (t.isJSXExpressionContainer(c)) {
      const inner = c.expression as BabelTypes.Expression;
      const isFunc = t.isArrowFunctionExpression(inner) || t.isFunctionExpression(inner);
      childrenExpr = isFunc ? inner : t.arrowFunctionExpression([], inner);
    } else {
      childrenExpr = t.arrowFunctionExpression([], c as any);
    }
  } else {
    childrenExpr = t.arrowFunctionExpression(
      [],
      t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), rawChildren as any[]) as any
    );
  }

  props.push(t.objectProperty(t.identifier('children'), childrenExpr));

  if (program) addImport(program, 'Tryer', '@pulsar-framework/pulsar.dev', t);

  path.replaceWith(t.callExpression(t.identifier('Tryer'), [t.objectExpression(props)]));
}

/**
 * {signal().map(callback)}  inside a JSXExpressionContainer
 * → ForRegistry({ each: () => signal(), children: callback })
 *
 * Only fires when the .map() source is a call expression (signal getter).
 * Static array `.map()` calls are left alone.
 */
function tryTransformMapToForRegistry(
  path: NodePath<BabelTypes.JSXExpressionContainer>,
  t: typeof BabelTypes,
  program: NodePath<BabelTypes.Program> | null
): boolean {
  const expr = path.node.expression;
  if (!t.isCallExpression(expr)) return false;

  const callee = expr.callee;
  if (!t.isMemberExpression(callee)) return false;

  const prop = callee.property;
  if (!t.isIdentifier(prop) || prop.name !== 'map') return false;

  const source = callee.object;
  // Must be any call expression — covers `items()`, `getFiltered(x())`, etc.
  if (!t.isCallExpression(source)) return false;

  const callback = expr.arguments[0] as BabelTypes.Expression | undefined;
  if (!callback) return false;

  if (program) addImport(program, 'ForRegistry', '@pulsar-framework/pulsar.dev', t);

  // Auto-derive key from the callback's first parameter: (item) => item.id
  // The param name is already in the callback — no guessing needed.
  const objProps: BabelTypes.ObjectProperty[] = [
    t.objectProperty(
      t.identifier('each'),
      t.arrowFunctionExpression([], source) // () => signal()
    ),
  ];

  const firstParam =
    (t.isArrowFunctionExpression(callback) || t.isFunctionExpression(callback)) &&
    callback.params.length > 0
      ? callback.params[0]
      : null;

  if (firstParam && t.isIdentifier(firstParam)) {
    // (item) => item?.id ?? item
    // - objects with .id  → item.id (stable numeric/string key)
    // - primitives        → item itself (string/number is its own key)
    // - objects without .id → falls back to the object reference
    const paramId = t.identifier(firstParam.name);
    const keyFn = t.arrowFunctionExpression(
      [t.identifier(firstParam.name)],
      t.logicalExpression(
        '??',
        t.optionalMemberExpression(paramId, t.identifier('id'), false, true),
        t.identifier(firstParam.name)
      )
    );
    objProps.push(t.objectProperty(t.identifier('key'), keyFn));
  }

  objProps.push(t.objectProperty(t.identifier('children'), callback));

  const callExpr = t.callExpression(t.identifier('ForRegistry'), [
    t.objectExpression(objProps),
  ]);

  path.replaceWith(callExpr as any);
  return true;
}

/**
 * Prepare the `when` prop value for ShowRegistry from a condition expression:
 * - `cond()`         → identifer `cond`   (zero-arg simple getter)
 * - complex expr     → `() => complexExpr`
 */
function prepareWhen(
  condition: BabelTypes.Expression,
  t: typeof BabelTypes
): BabelTypes.Expression {
  const isSimpleGetter =
    t.isCallExpression(condition) &&
    condition.arguments.length === 0 &&
    t.isIdentifier(condition.callee);
  return isSimpleGetter
    ? (condition.callee as BabelTypes.Identifier)
    : t.arrowFunctionExpression([], condition);
}

/**
 * {cond() ? <A/> : <B/>}  inside a JSXExpressionContainer
 * → ShowRegistry({ when: cond, children: () => <A/>, fallback: () => <B/> })
 *
 * Only fires when:
 *  - condition contains a reactive call (needsReactiveWrapper)
 *  - at least one branch is a JSX element / fragment
 */
function tryTransformTernaryToShowRegistry(
  path: NodePath<BabelTypes.JSXExpressionContainer>,
  t: typeof BabelTypes,
  program: NodePath<BabelTypes.Program> | null
): boolean {
  const expr = path.node.expression;
  if (!t.isConditionalExpression(expr)) return false;

  const { test, consequent, alternate } = expr;
  if (!needsReactiveWrapper(test, t)) return false;

  // Do NOT transform nested ternaries (A ? B : C ? D : E):
  // the alternate branch has its own reactive condition that must stay live.
  // ShowRegistry can only subscribe to one `when` — converting here would
  // make ShowRegistry subscribe only to `test`, losing reactivity for the
  // inner condition entirely.
  if (t.isConditionalExpression(alternate)) return false;

  const isJSX = (n: BabelTypes.Node) => t.isJSXElement(n) || t.isJSXFragment(n);
  if (!isJSX(consequent) && !isJSX(alternate)) return false;

  const wrapBranch = (node: BabelTypes.Expression): BabelTypes.Expression =>
    t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)
      ? node
      : t.arrowFunctionExpression([], node as any);

  if (program) addImport(program, 'ShowRegistry', '@pulsar-framework/pulsar.dev', t);

  const callExpr = t.callExpression(t.identifier('ShowRegistry'), [
    t.objectExpression([
      t.objectProperty(t.identifier('when'), prepareWhen(test, t)),
      t.objectProperty(t.identifier('children'), wrapBranch(consequent)),
      t.objectProperty(t.identifier('fallback'), wrapBranch(alternate)),
    ]),
  ]);

  path.replaceWith(callExpr as any);
  return true;
}

/**
 * {cond() && <A/>}  inside a JSXExpressionContainer
 * → ShowRegistry({ when: cond, children: () => <A/>, fallback: () => null })
 *
 * Only fires when the right operand is JSX.
 */
function tryTransformAndToShowRegistry(
  path: NodePath<BabelTypes.JSXExpressionContainer>,
  t: typeof BabelTypes,
  program: NodePath<BabelTypes.Program> | null
): boolean {
  const expr = path.node.expression;
  if (!t.isLogicalExpression(expr) || expr.operator !== '&&') return false;

  const { left, right } = expr;
  if (!needsReactiveWrapper(left, t)) return false;
  if (!t.isJSXElement(right) && !t.isJSXFragment(right)) return false;

  if (program) addImport(program, 'ShowRegistry', '@pulsar-framework/pulsar.dev', t);

  const callExpr = t.callExpression(t.identifier('ShowRegistry'), [
    t.objectExpression([
      t.objectProperty(t.identifier('when'), prepareWhen(left, t)),
      t.objectProperty(
        t.identifier('children'),
        t.arrowFunctionExpression([], right as any)
      ),
      t.objectProperty(
        t.identifier('fallback'),
        t.arrowFunctionExpression([], t.nullLiteral())
      ),
    ]),
  ]);

  path.replaceWith(callExpr as any);
  return true;
}

// ---------------------------------------------------------------------------
// Existing utility (unchanged)
// ---------------------------------------------------------------------------

/**
 * Get JSX element name as string
 */
function getJSXElementName(
  name: BabelTypes.JSXElement['openingElement']['name'],
  t: typeof BabelTypes
): string | null {
  if (t.isJSXIdentifier(name)) {
    return name.name;
  }
  if (t.isJSXMemberExpression(name)) {
    // Handle <Foo.Bar>
    const obj = name.object;
    const prop = name.property;
    if (t.isJSXIdentifier(obj) && t.isJSXIdentifier(prop)) {
      return `${obj.name}.${prop.name}`;
    }
  }
  return null;
}
