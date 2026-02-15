/**
 * Expected TypeScript output for 02-badge.psr
 * Tests: Function component (not "component" keyword), static JSX
 */

import { cn } from '@pulsar-framework/design-tokens';
import { $REGISTRY, t_element } from '@pulsar-framework/pulsar.dev';

export interface IBadgeProps {
  label: string;
  variant?: 'primary' | 'secondary';
  icon?: string;
}

export const Badge = ({ label, variant = 'primary', icon }: IBadgeProps): HTMLElement => {
  return $REGISTRY.execute('component:Badge', null, () => {
    const className = cn(
      'inline-flex items-center gap-1',
      variant === 'primary' ? 'bg-blue-600' : 'bg-gray-600'
    );

    return t_element('span', { className: className }, [
      () => icon && t_element('span', {}, [() => icon]),
      t_element('span', {}, [() => label]),
    ]);
  });
};
