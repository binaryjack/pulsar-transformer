/**
 * Transformer Configuration for Registry Integration
 */

export interface IRegistryTransformConfig {
  /**
   * Enable registry-enhanced createElement
   * Default: true
   */
  enableRegistry?: boolean;

  /**
   * Enable new registry pattern (wire-based reactivity)
   * When true, generates $REGISTRY.execute() wrappers and wire() calls
   * When false, uses legacy IIFE pattern with createEffect
   * Default: true
   */
  useRegistryPattern?: boolean;

  /**
   * Enable SSR support with data-hid attributes
   * Default: false
   */
  enableSSR?: boolean;

  /**
   * Enable optimization passes
   * Default: false
   */
  optimize?: boolean;

  /**
   * Optimizer configuration
   */
  optimizerConfig?: any;
}

/**
 * Default transformer configuration
 */
export const DEFAULT_REGISTRY_CONFIG: IRegistryTransformConfig = {
  enableRegistry: true,
  useRegistryPattern: true,
  enableSSR: false,
  optimize: false,
};
