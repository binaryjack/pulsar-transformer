#!/usr/bin/env node
/**
 * Minimal rendering test - Direct approach
 */

import { JSDOM } from 'jsdom';

// Setup DOM BEFORE importing pulsar.dev (router needs window)
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.document.createElement = dom.window.document.createElement.bind(dom.window.document);

// Use dynamic import AFTER globals are set
const { $REGISTRY, t_element } = await import('@pulsar-framework/pulsar.dev');

console.log('Testing t_element directly...\n');

try {
  // Test 1: Direct t_element call
  console.log('Test 1: Direct t_element call');
  const div = t_element('div', {}, ['Hello']);
  console.log('✅ Created element:', div.tagName);
  console.log('✅ Content:', div.textContent);

  // Test 2: With $REGISTRY.execute
  console.log('\nTest 2: With $REGISTRY.execute');
  const component = () => {
    return $REGISTRY.execute('test-component', null, () => {
      return t_element('span', {}, ['World']);
    });
  };

  const result = component();
  console.log('✅ Component rendered:', result.tagName);
  console.log('✅ Content:', result.textContent);

  console.log('\n🎉 Both tests passed!\n');
} catch (error) {
  console.log('\n❌ Error:', error.message);
  console.log('Stack:', error.stack);
  process.exit(1);
}
