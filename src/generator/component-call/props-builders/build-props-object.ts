import * as ts from 'typescript';
import { IPropIR } from '../../../ir/types/index.js';
import { IComponentCallContext } from '../component-call-generator.types.js';
import { validatePropValue } from './validate-prop-value.js';

/**
 * Builds the props object for a component call
 * Converts IPropIR[] into ts.ObjectLiteralElementLike[]
 */
export const buildPropsObject = function (
  props: IPropIR[],
  context: IComponentCallContext
): ts.ObjectLiteralElementLike[] {
  const propsProperties: ts.ObjectLiteralElementLike[] = [];

  props.forEach((prop: IPropIR) => {
    try {
      // Validate prop value
      if (!validatePropValue(prop)) {
        return;
      }

      // Use string literal for hyphenated properties
      const propNameNode = prop.name.includes('-')
        ? context.factory.createStringLiteral(prop.name)
        : context.factory.createIdentifier(prop.name);

      const propAssignment = context.factory.createPropertyAssignment(
        propNameNode,
        prop.value as ts.Expression
      );

      propsProperties.push(propAssignment);
    } catch (error) {
      console.error(
        `[buildPropsObject] Error creating property assignment for ${prop.name}:`,
        error
      );
      // Skip this prop and continue
    }
  });

  return propsProperties;
};
