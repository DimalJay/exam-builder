/**
 * The contract the preview depends on.
 *
 * `TypstPreview` knows nothing about `@myriaddreamin/typst.ts`, WASM, or the
 * browser. Swapping in a server-side compiler, a mock, or a snapshot test only
 * means providing another implementation of this interface (Dependency
 * Inversion).
 */

export type DiagnosticSeverity = 'error' | 'warning'

export interface TypstDiagnostic {
  severity: DiagnosticSeverity
  message: string
  /** Raw Typst source range, e.g. `main.typ:4:2-4:18`. Empty when unknown. */
  location: string
}

export interface CompileOutput {
  /** Vector-format document, ready for the renderer. Absent when compilation failed. */
  artifact?: Uint8Array
  diagnostics: TypstDiagnostic[]
  hasError: boolean
}

/**
 * A finished PDF, or the diagnostics explaining why there isn't one.
 *
 * Deliberately a separate shape from `CompileOutput`: the two artifacts are not
 * interchangeable, and a caller that reaches for `artifact` on a PDF result is
 * holding the wrong thing for the renderer.
 */
export interface PdfOutput {
  /** PDF bytes. Absent when compilation failed. */
  pdf?: Uint8Array
  diagnostics: TypstDiagnostic[]
  hasError: boolean
}

export interface TypstEngine {
  /**
   * Compile Typst source to a renderable artifact.
   *
   * Implementations may hold internal state, so callers must serialise calls:
   * one compile in flight at a time. `useTypstPreview` debounces input and
   * discards superseded results rather than relying on this being safe to
   * overlap.
   */
  compile(source: string): Promise<CompileOutput>

  /**
   * Compile Typst source to PDF bytes.
   *
   * Shares `compile`'s single-instance rule: Typst is one WASM module and
   * cannot produce two documents at once, so this is queued behind any in-flight
   * preview compile rather than racing it.
   */
  exportPdf(source: string): Promise<PdfOutput>
}