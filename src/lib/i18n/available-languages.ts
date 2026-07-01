import type {
  Language,
} from './types.ts';

/**
 * Available language configurations.
 *
 * Maps language codes to their corresponding language configurations.
 *
 * @constant
 *
 * @example
 * ```typescript
 * const languages = Object.keys(AVAILABLE_LANGUAGES);
 * ```
 */
export const AVAILABLE_LANGUAGES: Record<string, Language> = {};
