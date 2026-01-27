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
  optimize: false,
};
