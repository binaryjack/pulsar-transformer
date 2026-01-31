import * as ts from 'typescript';

// Intermediate Representation Types

export interface IComponentIR {
  name: string;
  props: IPropsIR;
  hooks: IHookIR[];
  jsx: IJSXElementIR;
  effects: IEffectIR[];
}

export interface IPropsIR {
  typeName?: string;
  properties: IPropertyIR[];
}

export interface IPropertyIR {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: ts.Expression | string | number | boolean | null;
}

export interface IJSXElementIR {
  type: 'element' | 'fragment' | 'component';
  tag?: string;
  tagName?: string; // Alias for tag
  component?: ts.Expression; // For component type
  props: IPropIR[];
  children: Array<IJSXElementIR | IExpressionIR | ITextIR>;
  isStatic: boolean;
  hasDynamicChildren: boolean;
  events: IEventIR[];
  key?: string;
}

export interface IPropIR {
  name: string;
  value: ts.Expression;
  isStatic: boolean;
  isDynamic: boolean;
  dependsOn: string[];
  isSpread?: boolean; // For spread props like {...props}
}

export interface IEventIR {
  type: string;
  name: string; // Event name (e.g., 'onClick')
  handler: ts.Expression;
  modifiers: string[];
}

export interface IExpressionIR {
  type: 'expression';
  expression: ts.Expression;
  isStatic: boolean;
  dependsOn: string[];
}

export interface ITextIR {
  type: 'text';
  value?: ts.Expression; // For dynamic text
  isDynamic?: boolean;
  content: string;
  isStatic: true;
}

export interface IEffectIR {
  dependencies: string[];
  effectNode: ts.Node;
  cleanupNode?: ts.Node;
}

export interface IHookIR {
  type: 'useState' | 'useEffect' | 'useMemo' | 'useCallback' | 'useRef';
  variable: string;
  args: ts.Expression[];
  dependencies?: string[];
}
