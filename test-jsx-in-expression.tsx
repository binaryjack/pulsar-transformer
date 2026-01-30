/**
 * Minimal test case for JSX inside logical expressions
 */

export const TestComponent = ({ required }: { required: boolean }): HTMLElement => (
  <div>{required && <span className="test">Required</span>}</div>
);
