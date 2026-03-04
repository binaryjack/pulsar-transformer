import { transformPSR } from './dist/index.js';

const src = `
import { createSignal, createEffect } from '@pulsar-framework/pulsar.dev';
export const ImageCard = ({ resource, index }) => {
  const [loading, setLoading] = createSignal(resource.isLoading);
  const [success, setSuccess] = createSignal(resource.isSuccess);
  const [imgSrc, setImgSrc] = createSignal(resource.data);
  createEffect(() => {
    setLoading(resource.isLoading);
    setSuccess(resource.isSuccess);
    setImgSrc(resource.data);
  });
  return (
    <div>
      {loading() ? <span>loading</span> : null}
      {success() ? <img src={imgSrc()} /> : null}
    </div>
  );
};
`;

const result = await transformPSR(src, 'image-card.psr');
console.log('=== TRANSFORMED OUTPUT ===');
console.log(result.code);
console.log('=== END ===');
