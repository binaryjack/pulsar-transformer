import { $REGISTRY, createSignal, t_element } from '@pulsar-framework/pulsar.dev';

export interface ICounterProps {
  id?: string;
}

export function Counter({ id }: ICounterProps): HTMLElement {
  return $REGISTRY.execute('component:Counter', () => {
    const [count, setCount] = createSignal(0);

    const increment = () => {
      setCount(count() + 1);
    };

    const decrement = () => {
      setCount(count() - 1);
    };

    return t_element('div', {}, [
      t_element('h2', {}, ['Counter: ', count()]),
      t_element('button', { onClick: increment }, ['Increment']),
      t_element('button', { onClick: decrement }, ['Decrement']),
    ]);
  });
}
