/**
 * Expected TypeScript output for 03-drawer.psr
 * Tests: useEffect preservation, complex logic, early returns
 */

import { cn } from '@pulsar-framework/design-tokens';
import { $REGISTRY, t_element, useEffect } from '@pulsar-framework/pulsar.dev';

export interface IDrawerProps {
  open: boolean;
  onClose: () => void;
  placement?: 'left' | 'right';
  children: any;
}

export const Drawer = ({
  open,
  onClose,
  placement = 'right',
  children,
}: IDrawerProps): HTMLElement => {
  return $REGISTRY.execute('component:Drawer', null, () => {
    useEffect(() => {
      if (!open) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    if (!open) return t_element('div', { style: 'display: none;' }, []);

    const drawerClasses = cn('fixed z-50 bg-white', placement === 'left' ? 'left-0' : 'right-0');

    return t_element('div', { className: drawerClasses }, [children]);
  });
};
