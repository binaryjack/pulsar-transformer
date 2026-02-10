import { createPipeline } from './dist/index.js';

const testCode = `
export const Drawer = ({
  open,
  placement = 'right',
  children
}: IDrawerProps): HTMLElement => {
  if (!open) return <div style="display: none;" />;
  
  return <div>{children}</div>;
};
`;

const pipeline = createPipeline({ 
  debug: true, 
  debugLevel: 'debug',
  debugChannels: ['parser', 'codegen']
});

try {
  const result = await pipeline.transform(testCode);
  console.log('SUCCESS:');
  console.log(result.code);
} catch (err) {
  console.error('ERROR:', err);
  console.error('Diagnostics:', err.diagnostics);
}
