import * as ts from 'typescript';
import { IJSXAnalyzer } from '../jsx-analyzer.types.js';

/**
 * Extracts event handlers from JSX attributes
 */
export const extractEvents = function (this: IJSXAnalyzer, attributes: ts.JsxAttributes): any[] {
  const events: any[] = [];

  attributes.properties.forEach((prop) => {
    if (ts.isJsxAttribute(prop)) {
      const name = ts.isIdentifier(prop.name) ? prop.name.text : 'unknown';

      // Check if attribute is an event handler (starts with 'on')
      if (name.startsWith('on') && prop.initializer) {
        // Extract the actual expression from JsxExpression wrapper
        let handler: ts.Expression | undefined;

        if (ts.isJsxExpression(prop.initializer)) {
          handler = prop.initializer.expression;
        } else {
          handler = prop.initializer as ts.Expression;
        }

        // Skip if no valid handler
        if (!handler) {
          return;
        }

        // Map onChange to 'input' event for input/textarea elements (React behavior)
        // The browser 'change' event only fires on blur, while 'input' fires on every keystroke
        let eventType: string;
        if (name === 'onChange') {
          eventType = 'input';
        } else {
          eventType = name.substring(2).toLowerCase();
        }

        events.push({
          type: eventType, // onClick -> click
          handler,
          modifiers: [],
        });
      }
    }
  });

  return events;
};
