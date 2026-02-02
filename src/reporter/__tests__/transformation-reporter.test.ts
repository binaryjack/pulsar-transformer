/**
 * TransformationReporter - Unit Tests
 *
 * Tests for the TransformationReporter error collection and display system.
 *
 * @see .github/05-TESTING-STANDARDS.md - Testing requirements
 */

import { createTransformationReporter } from '../create-transformation-reporter';

import type {
  ITransformationReporter,
  ITransformationIssue,
} from '../transformation-reporter.types';

describe('TransformationReporter', () => {
  let reporter: ITransformationReporter;

  beforeEach(() => {
    reporter = createTransformationReporter();
  });

  describe('creation', () => {
    it('should create reporter with empty collections', () => {
      expect(reporter.hasErrors()).toBe(false);
      expect(reporter.hasWarnings()).toBe(false);
      expect(reporter.getErrors()).toEqual([]);
      expect(reporter.getWarnings()).toEqual([]);
    });
  });

  describe('addError', () => {
    it('should add error to collection', () => {
      const error: ITransformationIssue = {
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Test error',
      };

      reporter.addError(error);

      expect(reporter.hasErrors()).toBe(true);
      expect(reporter.getErrors()).toHaveLength(1);
      expect(reporter.getErrors()[0]).toBe(error);
    });

    it('should add multiple errors', () => {
      const error1: ITransformationIssue = {
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Error 1',
      };

      const error2: ITransformationIssue = {
        type: 'MISSING_RETURN_TYPE',
        severity: 'error',
        location: { file: 'app.tsx', line: 20, column: 3 },
        message: 'Error 2',
      };

      reporter.addError(error1);
      reporter.addError(error2);

      expect(reporter.getErrors()).toHaveLength(2);
      expect(reporter.getErrors()[0]).toBe(error1);
      expect(reporter.getErrors()[1]).toBe(error2);
    });

    it('should handle error with all optional fields', () => {
      const error: ITransformationIssue = {
        type: 'COMPONENT_NOT_DETECTED',
        severity: 'error',
        component: 'MyButton',
        location: { file: 'button.tsx', line: 15, column: 1 },
        message: 'Component not detected',
        suggestion: 'Add return type annotation',
        exampleBefore: 'const MyButton = () => { ... }',
        exampleAfter: 'const MyButton = (): HTMLElement => { ... }',
        detectionResults: [
          { strategy: 'PascalCase', passed: true },
          { strategy: 'ReturnType', passed: false, reason: 'No return type' },
        ],
      };

      reporter.addError(error);

      const errors = reporter.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].component).toBe('MyButton');
      expect(errors[0].suggestion).toBe('Add return type annotation');
      expect(errors[0].exampleBefore).toBe('const MyButton = () => { ... }');
      expect(errors[0].exampleAfter).toBe('const MyButton = (): HTMLElement => { ... }');
      expect(errors[0].detectionResults).toHaveLength(2);
    });
  });

  describe('addWarning', () => {
    it('should add warning to collection', () => {
      const warning: ITransformationIssue = {
        type: 'NAMING_CONVENTION',
        severity: 'warning',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Test warning',
      };

      reporter.addWarning(warning);

      expect(reporter.hasWarnings()).toBe(true);
      expect(reporter.getWarnings()).toHaveLength(1);
      expect(reporter.getWarnings()[0]).toBe(warning);
    });

    it('should add multiple warnings', () => {
      const warning1: ITransformationIssue = {
        type: 'NAMING_CONVENTION',
        severity: 'warning',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Warning 1',
      };

      const warning2: ITransformationIssue = {
        type: 'INVALID_PATTERN',
        severity: 'warning',
        location: { file: 'app.tsx', line: 20, column: 3 },
        message: 'Warning 2',
      };

      reporter.addWarning(warning1);
      reporter.addWarning(warning2);

      expect(reporter.getWarnings()).toHaveLength(2);
      expect(reporter.getWarnings()[0]).toBe(warning1);
      expect(reporter.getWarnings()[1]).toBe(warning2);
    });
  });

  describe('hasErrors', () => {
    it('should return false when no errors', () => {
      expect(reporter.hasErrors()).toBe(false);
    });

    it('should return true when errors exist', () => {
      reporter.addError({
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: { file: 'app.tsx', line: 1, column: 1 },
        message: 'Error',
      });

      expect(reporter.hasErrors()).toBe(true);
    });

    it('should not be affected by warnings', () => {
      reporter.addWarning({
        type: 'NAMING_CONVENTION',
        severity: 'warning',
        location: { file: 'app.tsx', line: 1, column: 1 },
        message: 'Warning',
      });

      expect(reporter.hasErrors()).toBe(false);
    });
  });

  describe('hasWarnings', () => {
    it('should return false when no warnings', () => {
      expect(reporter.hasWarnings()).toBe(false);
    });

    it('should return true when warnings exist', () => {
      reporter.addWarning({
        type: 'NAMING_CONVENTION',
        severity: 'warning',
        location: { file: 'app.tsx', line: 1, column: 1 },
        message: 'Warning',
      });

      expect(reporter.hasWarnings()).toBe(true);
    });

    it('should not be affected by errors', () => {
      reporter.addError({
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: { file: 'app.tsx', line: 1, column: 1 },
        message: 'Error',
      });

      expect(reporter.hasWarnings()).toBe(false);
    });
  });

  describe('getErrors', () => {
    it('should return empty array when no errors', () => {
      expect(reporter.getErrors()).toEqual([]);
    });

    it('should return all errors', () => {
      const error1: ITransformationIssue = {
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Error 1',
      };

      const error2: ITransformationIssue = {
        type: 'MISSING_RETURN_TYPE',
        severity: 'error',
        location: { file: 'app.tsx', line: 20, column: 3 },
        message: 'Error 2',
      };

      reporter.addError(error1);
      reporter.addError(error2);

      const errors = reporter.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0]).toBe(error1);
      expect(errors[1]).toBe(error2);
    });
  });

  describe('getWarnings', () => {
    it('should return empty array when no warnings', () => {
      expect(reporter.getWarnings()).toEqual([]);
    });

    it('should return all warnings', () => {
      const warning1: ITransformationIssue = {
        type: 'NAMING_CONVENTION',
        severity: 'warning',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Warning 1',
      };

      const warning2: ITransformationIssue = {
        type: 'INVALID_PATTERN',
        severity: 'warning',
        location: { file: 'app.tsx', line: 20, column: 3 },
        message: 'Warning 2',
      };

      reporter.addWarning(warning1);
      reporter.addWarning(warning2);

      const warnings = reporter.getWarnings();
      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toBe(warning1);
      expect(warnings[1]).toBe(warning2);
    });
  });

  describe('clear', () => {
    it('should clear all errors and warnings', () => {
      reporter.addError({
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: { file: 'app.tsx', line: 1, column: 1 },
        message: 'Error',
      });

      reporter.addWarning({
        type: 'NAMING_CONVENTION',
        severity: 'warning',
        location: { file: 'app.tsx', line: 1, column: 1 },
        message: 'Warning',
      });

      expect(reporter.hasErrors()).toBe(true);
      expect(reporter.hasWarnings()).toBe(true);

      reporter.clear();

      expect(reporter.hasErrors()).toBe(false);
      expect(reporter.hasWarnings()).toBe(false);
      expect(reporter.getErrors()).toEqual([]);
      expect(reporter.getWarnings()).toEqual([]);
    });

    it('should handle clearing empty collections', () => {
      reporter.clear();

      expect(reporter.hasErrors()).toBe(false);
      expect(reporter.hasWarnings()).toBe(false);
    });

    it('should allow re-adding after clear', () => {
      reporter.addError({
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: { file: 'app.tsx', line: 1, column: 1 },
        message: 'Error 1',
      });

      reporter.clear();

      reporter.addError({
        type: 'MISSING_RETURN_TYPE',
        severity: 'error',
        location: { file: 'app.tsx', line: 2, column: 1 },
        message: 'Error 2',
      });

      expect(reporter.getErrors()).toHaveLength(1);
      expect(reporter.getErrors()[0].message).toBe('Error 2');
    });
  });

  describe('displayErrors', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should not display when no errors', () => {
      reporter.displayErrors();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should display error with basic info', () => {
      reporter.addError({
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Test error',
      });

      reporter.displayErrors();

      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = consoleErrorSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('PULSAR TRANSFORMATION ERRORS');
      expect(output).toContain('app.tsx:10:5');
      expect(output).toContain('UNTRANSFORMED_JSX');
      expect(output).toContain('Test error');
      expect(output).toContain('Total Errors: 1');
    });

    it('should display component name when provided', () => {
      reporter.addError({
        type: 'COMPONENT_NOT_DETECTED',
        severity: 'error',
        component: 'MyButton',
        location: { file: 'button.tsx', line: 15, column: 1 },
        message: 'Component not detected',
      });

      reporter.displayErrors();

      const output = consoleErrorSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Component: MyButton');
    });

    it('should display suggestion when provided', () => {
      reporter.addError({
        type: 'MISSING_RETURN_TYPE',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Missing return type',
        suggestion: 'Add ": HTMLElement" return type annotation',
      });

      reporter.displayErrors();

      const output = consoleErrorSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Suggestion:');
      expect(output).toContain('Add ": HTMLElement" return type annotation');
    });

    it('should display before/after examples when provided', () => {
      reporter.addError({
        type: 'COMPONENT_NOT_DETECTED',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Component not detected',
        exampleBefore: 'const MyButton = () => { return <button>Click</button>; }',
        exampleAfter: 'const MyButton = (): HTMLElement => { return <button>Click</button>; }',
      });

      reporter.displayErrors();

      const output = consoleErrorSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('❌ Before:');
      expect(output).toContain('const MyButton = () =>');
      expect(output).toContain('✅ After:');
      expect(output).toContain('const MyButton = (): HTMLElement =>');
    });

    it('should display detection results when provided', () => {
      reporter.addError({
        type: 'COMPONENT_NOT_DETECTED',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Component not detected',
        detectionResults: [
          { strategy: 'PascalCaseStrategy', passed: true },
          { strategy: 'ReturnTypeStrategy', passed: false, reason: 'No return type annotation' },
          { strategy: 'DirectJsxReturnStrategy', passed: false, reason: 'No direct JSX return' },
        ],
      });

      reporter.displayErrors();

      const output = consoleErrorSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Detection Results:');
      expect(output).toContain('✅ PascalCaseStrategy');
      expect(output).toContain('❌ ReturnTypeStrategy: No return type annotation');
      expect(output).toContain('❌ DirectJsxReturnStrategy: No direct JSX return');
    });

    it('should display multiple errors with separators', () => {
      reporter.addError({
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Error 1',
      });

      reporter.addError({
        type: 'MISSING_RETURN_TYPE',
        severity: 'error',
        location: { file: 'app.tsx', line: 20, column: 3 },
        message: 'Error 2',
      });

      reporter.displayErrors();

      const output = consoleErrorSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Error 1');
      expect(output).toContain('Error 2');
      expect(output).toContain('Total Errors: 2');
    });
  });

  describe('displayWarnings', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should not display when no warnings', () => {
      reporter.displayWarnings();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should display warning with basic info', () => {
      reporter.addWarning({
        type: 'NAMING_CONVENTION',
        severity: 'warning',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Test warning',
      });

      reporter.displayWarnings();

      expect(consoleWarnSpy).toHaveBeenCalled();
      const output = consoleWarnSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('PULSAR TRANSFORMATION WARNINGS');
      expect(output).toContain('app.tsx:10:5');
      expect(output).toContain('NAMING_CONVENTION');
      expect(output).toContain('Test warning');
      expect(output).toContain('Total Warnings: 1');
    });

    it('should display multiple warnings', () => {
      reporter.addWarning({
        type: 'NAMING_CONVENTION',
        severity: 'warning',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Warning 1',
      });

      reporter.addWarning({
        type: 'INVALID_PATTERN',
        severity: 'warning',
        location: { file: 'app.tsx', line: 20, column: 3 },
        message: 'Warning 2',
      });

      reporter.displayWarnings();

      const output = consoleWarnSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Warning 1');
      expect(output).toContain('Warning 2');
      expect(output).toContain('Total Warnings: 2');
    });
  });

  describe('edge cases', () => {
    it('should handle multi-line messages', () => {
      reporter.addError({
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Line 1\nLine 2\nLine 3',
      });

      const errors = reporter.getErrors();
      expect(errors[0].message).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle multi-line suggestions', () => {
      reporter.addError({
        type: 'COMPONENT_NOT_DETECTED',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Test',
        suggestion: 'Step 1: Do this\nStep 2: Do that\nStep 3: Done',
      });

      const errors = reporter.getErrors();
      expect(errors[0].suggestion).toBe('Step 1: Do this\nStep 2: Do that\nStep 3: Done');
    });

    it('should handle long file paths', () => {
      reporter.addError({
        type: 'UNTRANSFORMED_JSX',
        severity: 'error',
        location: {
          file: 'src/components/features/user/profile/settings/advanced/MyVeryLongComponentName.tsx',
          line: 100,
          column: 50,
        },
        message: 'Test',
      });

      const errors = reporter.getErrors();
      expect(errors[0].location.file).toContain('MyVeryLongComponentName.tsx');
    });

    it('should handle empty detection results array', () => {
      reporter.addError({
        type: 'COMPONENT_NOT_DETECTED',
        severity: 'error',
        location: { file: 'app.tsx', line: 10, column: 5 },
        message: 'Test',
        detectionResults: [],
      });

      const errors = reporter.getErrors();
      expect(errors[0].detectionResults).toEqual([]);
    });
  });

  describe('performance', () => {
    it('should handle 1000 errors efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        reporter.addError({
          type: 'UNTRANSFORMED_JSX',
          severity: 'error',
          location: { file: `file-${i}.tsx`, line: i, column: 1 },
          message: `Error ${i}`,
        });
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // 100ms for 1000 errors
      expect(reporter.getErrors()).toHaveLength(1000);
    });

    it('should handle 1000 warnings efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        reporter.addWarning({
          type: 'NAMING_CONVENTION',
          severity: 'warning',
          location: { file: `file-${i}.tsx`, line: i, column: 1 },
          message: `Warning ${i}`,
        });
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // 100ms for 1000 warnings
      expect(reporter.getWarnings()).toHaveLength(1000);
    });
  });
});
