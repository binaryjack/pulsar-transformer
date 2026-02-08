import { createParser } from './dist/index.js';

const code = `export const Button = ({
  config = buttonDefaultConfig,
  styling = buttonDefaultStyling,
  type = 'button',
  children,
  onclick,
  ...rest
}: IButtonProps): HTMLElement => {
  return null;
};`;

const parser = createParser();
try {
  parser.parse(code);
  console.log('✅ Multi-param destructuring test PASSED!');
} catch (e) {
  console.error('❌ ERROR:', e.message);
  console.error('At position:', e.location || 'unknown');
}
