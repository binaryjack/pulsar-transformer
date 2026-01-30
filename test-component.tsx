/**
 * Simple test component to verify JSX transformation in component bodies
 */

export const TestComponent = (): HTMLElement => (
  <div className="test">
    <span>Hello</span>
    <span>World</span>
  </div>
);

export const TestWithNestedComponent = (): HTMLElement => (
  <div>
    <TestComponent />
  </div>
);
