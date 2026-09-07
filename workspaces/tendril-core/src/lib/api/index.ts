/**
 * Redaction helpers for masking matching words within an AST or parsed text.
 *
 * @see {@link Redact.fromAST}
 * @see {@link Redact.fromString}
 */
export * as Redact from './redact.ts';

/**
 * Helpers for removing quoted text (and its quote characters) from an AST or
 *   parsed text.
 *
 * @see {@link RemoveQuotes.fromAST}
 * @see {@link RemoveQuotes.fromString}
 * @see {@link RemoveQuotes.fromStringWithMismatchedQuotes}
 */
export * as RemoveQuotes from './remove-quotes.ts';

export * from './render-ast-file.ts';
