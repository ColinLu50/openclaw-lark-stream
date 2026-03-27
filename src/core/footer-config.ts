/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Default values and resolution logic for the Feishu card footer configuration.
 *
 * Each boolean flag controls whether a particular metadata item is displayed
 * in the card footer (e.g. elapsed time, model name).
 */

import type { FeishuFooterConfig } from './types';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/**
 * The default footer configuration (compact mode).
 *
 * Status, elapsed, tokens and context usage are on by default.
 * Cache details and model name are off by default.
 * verbose is off by default (compact icon format).
 */
export const DEFAULT_FOOTER_CONFIG: Required<FeishuFooterConfig> = {
  verbose: false,
  status: true,
  elapsed: true,
  tokens: true,
  cache: false,
  context: true,
  model: false,
};

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Merge a partial footer configuration with `DEFAULT_FOOTER_CONFIG`.
 *
 * When `verbose: true`, cache and model default to true unless explicitly disabled.
 * Fields present in the input take precedence; anything absent falls back to the default.
 */
export function resolveFooterConfig(cfg?: FeishuFooterConfig): Required<FeishuFooterConfig> {
  if (!cfg) return { ...DEFAULT_FOOTER_CONFIG };
  const verbose = cfg.verbose ?? DEFAULT_FOOTER_CONFIG.verbose;
  return {
    verbose,
    status: cfg.status ?? DEFAULT_FOOTER_CONFIG.status,
    elapsed: cfg.elapsed ?? DEFAULT_FOOTER_CONFIG.elapsed,
    tokens: cfg.tokens ?? DEFAULT_FOOTER_CONFIG.tokens,
    cache: cfg.cache ?? (verbose ? true : DEFAULT_FOOTER_CONFIG.cache),
    context: cfg.context ?? DEFAULT_FOOTER_CONFIG.context,
    model: cfg.model ?? (verbose ? true : DEFAULT_FOOTER_CONFIG.model),
  };
}
