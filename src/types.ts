import { type LogChannel, type LogLevel } from './debug/logger.js';

export interface IPipelineOptions {
  filePath?: string;
  debug?: boolean;
  debugLevel?: LogLevel;
  debugChannels?: LogChannel[];
  useTransformer?: boolean;
  // Use new Babel parser? Default true.
  useBabel?: boolean;
}

export interface IPipelineResult {
  code: string;
  diagnostics: IDiagnostic[];
  metrics?: IPipelineMetrics;
  /** Source map mapping generated TypeScript back to the original PSR source. */
  map?: Record<string, unknown> | null;
}

export interface IDiagnostic {
  type: 'error' | 'warning' | 'info';
  message: string;
  phase: string;
  line?: number;
  column?: number;
  source?: string;
  frame?: string;
}

export interface IPipelineMetrics {
  preprocessorTime?: number;
  lexerTime: number;
  parserTime: number;
  transformTime: number;
  totalTime: number;
  tokenCount?: number;
  statementCount?: number;
  outputSize?: number;
}
