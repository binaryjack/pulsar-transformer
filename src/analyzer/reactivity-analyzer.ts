/**
 * Reactivity Analyzer - Based on SolidJS and Vue Patterns
 *
 * Analyzes and transforms reactive primitives:
 * - Signal detection and transformation
 * - Computed/memo dependencies
 * - Effect tracking
 * - Reactive scope analysis
 * - Dependency graph construction
 *
 * @see https://github.com/solidjs/solid/blob/main/packages/babel-preset-solid
 * @see https://github.com/vuejs/core/blob/main/packages/reactivity-transform
 */

export interface ReactiveBinding {
  /** Binding name (e.g., 'count' in `const count = signal(0)`) */
  name: string;
  /** Reactive type */
  type: 'signal' | 'memo' | 'effect' | 'resource' | 'store';
  /** Initial value expression */
  initializer?: string;
  /** Is destructured (e.g., `const [count, setCount] = signal(0)`) */
  isDestructured: boolean;
  /** Accessor name (if destructured) */
  accessor?: string;
  /** Setter name (if destructured) */
  setter?: string;
  /** Scope depth */
  scopeDepth: number;
}

export interface ReactiveDependency {
  /** Source binding */
  source: string;
  /** Target binding */
  target: string;
  /** Dependency type */
  type: 'read' | 'write' | 'readwrite';
}

export interface ReactiveScope {
  /** Unique scope ID */
  id: number;
  /** Parent scope ID */
  parentId?: number;
  /** Bindings in this scope */
  bindings: Map<string, ReactiveBinding>;
  /** Dependencies in this scope */
  dependencies: ReactiveDependency[];
  /** Is this a reactive scope (inside effect/memo) */
  isReactive: boolean;
}

export interface ReactivityAnalyzer {
  /** Enter a new scope */
  enterScope(isReactive?: boolean): number;

  /** Exit current scope */
  exitScope(): void;

  /** Get current scope */
  getCurrentScope(): ReactiveScope;

  /** Register a reactive binding */
  registerBinding(binding: ReactiveBinding): void;

  /** Check if identifier is reactive */
  isReactive(name: string): boolean;

  /** Get binding info */
  getBinding(name: string): ReactiveBinding | undefined;

  /** Track dependency */
  trackDependency(source: string, target: string, type: ReactiveDependency['type']): void;

  /** Get all dependencies for a binding */
  getDependencies(name: string): ReactiveDependency[];

  /** Transform signal() to createSignal() */
  transformSignal(code: string): string;

  /** Transform computed() to createMemo() */
  transformComputed(code: string): string;

  /** Transform effect() to createEffect() */
  transformEffect(code: string): string;

  /** Generate dependency tracking code */
  generateDependencyTracking(name: string): string;

  /** Get all scopes */
  getScopes(): ReactiveScope[];

  /** Clear all state */
  clear(): void;
}

/**
 * Create reactivity analyzer instance
 */
export function createReactivityAnalyzer(): ReactivityAnalyzer {
  const scopes: ReactiveScope[] = [];
  let currentScopeId = -1;
  let nextScopeId = 0;

  function getCurrentScopeOrThrow(): ReactiveScope {
    if (currentScopeId === -1) {
      throw new Error('No active scope');
    }
    return scopes[currentScopeId];
  }

  function findBinding(name: string, scopeId = currentScopeId): ReactiveBinding | undefined {
    if (scopeId === -1) return undefined;

    const scope = scopes[scopeId];
    const binding = scope.bindings.get(name);

    if (binding) return binding;

    // Check parent scope
    if (scope.parentId !== undefined) {
      return findBinding(name, scope.parentId);
    }

    return undefined;
  }

  return {
    enterScope(isReactive = false): number {
      const id = nextScopeId++;
      const scope: ReactiveScope = {
        id,
        parentId: currentScopeId >= 0 ? currentScopeId : undefined,
        bindings: new Map(),
        dependencies: [],
        isReactive,
      };

      scopes[id] = scope;
      currentScopeId = id;

      return id;
    },

    exitScope(): void {
      if (currentScopeId === -1) {
        throw new Error('Cannot exit scope: no active scope');
      }

      const currentScope = scopes[currentScopeId];
      currentScopeId = currentScope.parentId ?? -1;
    },

    getCurrentScope(): ReactiveScope {
      return getCurrentScopeOrThrow();
    },

    registerBinding(binding: ReactiveBinding): void {
      const scope = getCurrentScopeOrThrow();
      scope.bindings.set(binding.name, binding);
    },

    isReactive(name: string): boolean {
      const binding = findBinding(name);
      return binding !== undefined;
    },

    getBinding(name: string): ReactiveBinding | undefined {
      return findBinding(name);
    },

    trackDependency(source: string, target: string, type: ReactiveDependency['type']): void {
      const scope = getCurrentScopeOrThrow();

      // Avoid duplicate dependencies
      const exists = scope.dependencies.some(
        (dep) => dep.source === source && dep.target === target
      );

      if (!exists) {
        scope.dependencies.push({ source, target, type });
      }
    },

    getDependencies(name: string): ReactiveDependency[] {
      const deps: ReactiveDependency[] = [];

      for (const scope of scopes) {
        const scopeDeps = scope.dependencies.filter(
          (dep) => dep.source === name || dep.target === name
        );
        deps.push(...scopeDeps);
      }

      return deps;
    },

    transformSignal(code: string): string {
      // Transform: signal(initialValue) => createSignal(initialValue)
      // Transform: const count = signal(0) => const [count, setCount] = createSignal(0)

      // Pattern 1: Destructured assignment
      const destructuredPattern =
        /const\s+\[([a-zA-Z_$][a-zA-Z0-9_$]*),\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\]\s*=\s*signal\(([^)]*)\)/g;

      code = code.replace(destructuredPattern, (match, accessor, setter, initializer) => {
        return `const [${accessor}, ${setter}] = createSignal(${initializer})`;
      });

      // Pattern 2: Direct assignment (auto-generate names)
      const directPattern = /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*signal\(([^)]*)\)/g;

      code = code.replace(directPattern, (match, name, initializer) => {
        // Generate setter name: count => setCount
        const setterName = `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        return `const [${name}, ${setterName}] = createSignal(${initializer})`;
      });

      // Pattern 3: Standalone signal() call
      const standalonePattern = /\bsignal\(/g;
      code = code.replace(standalonePattern, 'createSignal(');

      return code;
    },

    transformComputed(code: string): string {
      // Transform: computed(() => expr) => createMemo(() => expr)
      // Transform: const total = computed(() => count() + 1) => const total = createMemo(() => count() + 1)

      const pattern = /\bcomputed\(/g;
      return code.replace(pattern, 'createMemo(');
    },

    transformEffect(code: string): string {
      // Transform: effect(() => {...}) => createEffect(() => {...})

      const pattern = /\beffect\(/g;
      return code.replace(pattern, 'createEffect(');
    },

    generateDependencyTracking(name: string): string {
      const binding = findBinding(name);
      if (!binding) {
        return `// No reactive binding found for '${name}'`;
      }

      const deps = this.getDependencies(name);

      if (deps.length === 0) {
        return `// No dependencies tracked for '${name}'`;
      }

      const depList = deps
        .map((dep) => {
          const role = dep.source === name ? 'producer' : 'consumer';
          const other = dep.source === name ? dep.target : dep.source;
          return `  // ${role}: ${other} (${dep.type})`;
        })
        .join('\n');

      return `// Dependencies for '${name}':\n${depList}`;
    },

    getScopes(): ReactiveScope[] {
      return scopes;
    },

    clear(): void {
      scopes.length = 0;
      currentScopeId = -1;
      nextScopeId = 0;
    },
  };
}

/**
 * Auto-detect reactivity patterns in code
 */
export function detectReactivityPatterns(code: string): {
  hasSignals: boolean;
  hasMemos: boolean;
  hasEffects: boolean;
  hasResources: boolean;
  hasStore: boolean;
} {
  return {
    hasSignals: /\bsignal\s*\(/.test(code) || /\bcreateSignal\s*\(/.test(code),
    hasMemos: /\bcomputed\s*\(/.test(code) || /\bcreateMemo\s*\(/.test(code),
    hasEffects: /\beffect\s*\(/.test(code) || /\bcreateEffect\s*\(/.test(code),
    hasResources: /\bresource\s*\(/.test(code) || /\bcreateResource\s*\(/.test(code),
    hasStore: /\bstore\s*\(/.test(code) || /\bcreateStore\s*\(/.test(code),
  };
}

/**
 * Extract reactive bindings from code
 */
export function extractReactiveBindings(code: string): ReactiveBinding[] {
  const bindings: ReactiveBinding[] = [];

  // Extract signal bindings
  // Pattern: const [count, setCount] = signal(0)
  const destructuredSignalPattern =
    /const\s+\[([a-zA-Z_$][a-zA-Z0-9_$]*),\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\]\s*=\s*(?:create)?[Ss]ignal\(([^)]*)\)/g;

  let match: RegExpExecArray | null;
  while ((match = destructuredSignalPattern.exec(code)) !== null) {
    bindings.push({
      name: match[1],
      type: 'signal',
      initializer: match[3],
      isDestructured: true,
      accessor: match[1],
      setter: match[2],
      scopeDepth: 0, // Will be updated during scope analysis
    });
  }

  // Pattern: const count = signal(0)
  const directSignalPattern =
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:create)?[Ss]ignal\(([^)]*)\)/g;

  while ((match = directSignalPattern.exec(code)) !== null) {
    // Skip if already captured as destructured
    if (bindings.some((b) => b.name === match![1])) continue;

    bindings.push({
      name: match[1],
      type: 'signal',
      initializer: match[2],
      isDestructured: false,
      scopeDepth: 0,
    });
  }

  // Extract memo bindings
  const memoPattern = /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:create)?(?:Memo|computed)\(/g;

  while ((match = memoPattern.exec(code)) !== null) {
    bindings.push({
      name: match[1],
      type: 'memo',
      isDestructured: false,
      scopeDepth: 0,
    });
  }

  // Extract effect bindings
  const effectPattern = /(?:create)?[Ee]ffect\(/g;

  while ((match = effectPattern.exec(code)) !== null) {
    bindings.push({
      name: `__effect_${bindings.filter((b) => b.type === 'effect').length}`,
      type: 'effect',
      isDestructured: false,
      scopeDepth: 0,
    });
  }

  return bindings;
}
