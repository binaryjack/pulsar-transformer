import { IPropIR } from '../../../ir/types/index.js';

/**
 * Validates that a prop has a valid value
 * Returns true if prop is valid, false otherwise
 */
export const validatePropValue = function (prop: IPropIR): boolean {
  // Skip props without values (except false/0)
  if (!prop.value && prop.value !== false && prop.value !== 0) {
    return false;
  }

  const valueExpr = prop.value;

  // Ensure value is an object (TypeScript AST node)
  if (!valueExpr || typeof valueExpr !== 'object') {
    console.warn(`[validatePropValue] Prop ${prop.name} has invalid value type:`, typeof valueExpr);
    return false;
  }

  // Check for .kind property (all TS nodes must have this)
  if (!('kind' in valueExpr) || typeof (valueExpr as any).kind !== 'number') {
    console.warn(`[validatePropValue] Prop ${prop.name} missing or invalid .kind property`);
    return false;
  }

  return true;
};
