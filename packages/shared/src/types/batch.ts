// ============================================================
// Batch Input/Output Types — Appendix B
// ============================================================

import { Kit } from './kit';

/** A single case in the batch input file */
export interface BatchCase {
  id: string;
  jd: string;
  company_url: string;
  days: number;
}

/** Batch input is an array of cases */
export type BatchInput = BatchCase[];

/** Error details for a failed case */
export interface BatchError {
  code: string;
  message: string;
}

/** Result for a single case */
export interface BatchKitResult {
  id: string;
  status: 'ok' | 'failed';
  kit: Kit | null;
  error: BatchError | null;
}

/** The complete batch output file */
export interface BatchOutput {
  version: '1.0';
  generated_at: string; // ISO 8601
  kits: BatchKitResult[];
}
