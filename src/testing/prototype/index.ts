/**
 * Prototype Method Attachments
 *
 * Attaches all prototype methods to PSRTestRunner.
 */

import { PSRTestRunner } from '../psr-test-runner.js'
import { _createMockRegistry } from './create-mock-registry.js'
import { _executeInDOM } from './execute-in-dom.js'
import { getConfig } from './get-config.js'
import { _mockCreateEffect, _mockCreateMemo, _mockCreateSignal, _mockTElement } from './mock-runtime.js'
import { runTest } from './run-test.js'
import { runTests } from './run-tests.js'
import { _testEvent } from './test-event.js'
import { _testReactivity } from './test-reactivity.js'
import { _validateDOM } from './validate-dom.js'
import { _validateStyles } from './validate-styles.js'

// Attach prototype methods
PSRTestRunner.prototype.getConfig = getConfig;
PSRTestRunner.prototype.runTest = runTest;
PSRTestRunner.prototype.runTests = runTests;

// Attach internal helper methods
(PSRTestRunner.prototype as any)._executeInDOM = _executeInDOM;
(PSRTestRunner.prototype as any)._createMockRegistry = _createMockRegistry;
(PSRTestRunner.prototype as any)._mockCreateSignal = _mockCreateSignal;
(PSRTestRunner.prototype as any)._mockCreateEffect = _mockCreateEffect;
(PSRTestRunner.prototype as any)._mockCreateMemo = _mockCreateMemo;
(PSRTestRunner.prototype as any)._mockTElement = _mockTElement;
(PSRTestRunner.prototype as any)._validateDOM = _validateDOM;
(PSRTestRunner.prototype as any)._validateStyles = _validateStyles;
(PSRTestRunner.prototype as any)._testReactivity = _testReactivity;
(PSRTestRunner.prototype as any)._testEvent = _testEvent;
