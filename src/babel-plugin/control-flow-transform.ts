/**
 * Control Flow Transformation for Pulsar
 * Transforms control flow components to JavaScript expressions
 *
 * Transformations:
 * - <Show when={condition}>{children}</Show> → condition ? children : null
 * - <Show when={condition} fallback={<div/>}>{children}</Show> → condition ? children : fallback
 * - <For each={items}>{item => <div/>}</For> → items().map(item => ...)
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

      // Handle <Show> / <ShowRegistry>
      if (tagName === 'Show' || tagName === 'ShowRegistry') {
        transformShow(path, t);
        return;
      }

      // Handle <For> / <ForRegistry>
      if (tagName === 'For' || tagName === 'ForRegistry') {
        transformFor(path, t);
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

  // First child should be the callback function
  const firstChild = children[0];
  let callback: BabelTypes.Expression;

  if (t.isJSXExpressionContainer(firstChild)) {
    callback = firstChild.expression as BabelTypes.Expression;
  } else {
    // If not a function, wrap children in arrow function
    // (item) => children
    const itemParam = t.identifier('item');
    const childrenArray = children.filter(
      (child) => !t.isJSXText(child) || child.value.trim()
    ) as any[];

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
