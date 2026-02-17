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
 */

import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';

export function createControlFlowTransform(t: typeof BabelTypes) {
  return {
    JSXElement(path: NodePath<BabelTypes.JSXElement>) {
      const openingElement = path.node.openingElement;
      const tagName = getJSXElementName(openingElement.name, t);

      if (!tagName) return;

      // Handle <Show> (compile-time - transform to ternary)
      if (tagName === 'Show') {
        transformShow(path, t);
        return;
      }

      // Handle <ShowRegistry> (runtime component with lazy children)
      if (tagName === 'ShowRegistry') {
        transformShowRegistry(path, t);
        return;
      }

      // Handle <For> (compile-time - transform to .map())
      if (tagName === 'For') {
        transformFor(path, t);
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
 */
function transformShowRegistry(path: NodePath<BabelTypes.JSXElement>, t: typeof BabelTypes) {
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
          props.push(
            t.objectProperty(t.identifier('when'), attr.value.expression as BabelTypes.Expression)
          );
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

  const componentCall = t.callExpression(t.identifier('ShowRegistry'), [t.objectExpression(props)]);
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

  // Create: arrayExpr.map(callback)
  const mapCall = t.callExpression(t.memberExpression(arrayExpr, t.identifier('map')), [callback]);

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
