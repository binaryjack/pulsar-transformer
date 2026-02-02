/**
 * Test Component: Variable JSX Pattern
 * 
 * This is THE BIG FIX validation - testing that the VariableJsxReturnStrategy
 * correctly detects components that assign JSX to a variable then return it.
 * 
 * This pattern previously caused infinite loops because the transformer couldn't
 * detect it was a component and failed to transform the JSX.
 */

import { useState } from '@pulsar/core';

/**
 * Component using variable JSX pattern (previously broken)
 * 
 * Pattern: const element = <JSX>; return element;
 * Expected: ComponentDetector should detect this with VariableJsxReturnStrategy (P2)
 */
export const TestVariableJsx = (): HTMLElement => {
  const [count, setCount] = useState(0);

  // JSX assigned to variable (THE pattern that was broken)
  const container = (
    <div style="padding: 2rem;">
      <h2>Variable JSX Pattern Test</h2>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(prev => prev + 1)}>
        Increment
      </button>
    </div>
  );

  // Return variable (not direct JSX)
  return container;
};

/**
 * Component with const destructured JSX
 */
export const TestDestructuredJsx = (): HTMLElement => {
  const element = (
    <div>
      <p>Destructured pattern</p>
    </div>
  );
  
  return element;
};

/**
 * Component with conditional variable JSX
 */
export const TestConditionalVariable = (): HTMLElement => {
  const [show, setShow] = useState(true);
  
  const content = show() ? (
    <div>Visible</div>
  ) : (
    <div>Hidden</div>
  );
  
  return content;
};

/**
 * Component with direct return (should still work)
 */
export const TestDirectReturn = (): HTMLElement => {
  return (
    <div>
      <p>Direct return pattern</p>
    </div>
  );
};
