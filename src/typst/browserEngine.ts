import {
  createTypstCompiler,
  loadFonts,
  type TypstCompiler,
} from '@myriaddreamin/typst.ts'
// `CompileFormatEnum` is not re-exported from the package root, only from the
// subpath. Both resolve to the same module instance, so the enum used here is
// the identical object the compiler compares `format` against.
import { CompileFormatEnum } from '@myriaddreamin/typst.ts/compiler'
// Vite resolves the `?url` suffix to an emitted asset URL, so the 28 MB module
// is served as a real file instead of being inlined into the JS bundle.
// Without this the wasm-bindgen shim falls back to its default importer, which
// throws in the browser.
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/wasm?url'

import type {
  CompileOutput,
  PdfOutput,
  TypstDiagnostic,
  TypstEngine,
} from './engine'
import { FONT_URLS } from './fonts'

const MAIN_FILE = '/main.typ'

/** Typst reports its own severity vocabulary; map it onto ours. */
function toSeverity(raw: string): TypstDiagnostic['severity'] {
  return raw.toLowerCase().includes('error') ? 'error' : 'warning'
}

/**
 * Browser-backed Typst compiler.
 *
 * Initialisation is lazy and memoised: loading and instantiating the WASM
 * module costs hundreds of milliseconds, and the preview mounts once but
 * recompiles on every keystroke.
 */
export function createBrowserTypstEngine(): TypstEngine {
  let compilerPromise: Promise<TypstCompiler> | null = null

  function getCompiler(): Promise<TypstCompiler> {
    compilerPromise ??= (async () => {
      const compiler = createTypstCompiler()
      await compiler.init({
        getModule: () => compilerWasmUrl,
        // The driver would otherwise inject `loadFonts([], { assets: ['text'] })`,
        // which downloads 18 font files from cdn.jsdelivr.net during init: 5.7s
        // on a good connection, and an indefinite hang when the CDN is slow or
        // blocked. Listing our own hosted faces keeps init local, and naming them
        // explicitly stops the default bundle being pulled in on top.
        beforeBuild: [loadFonts([...FONT_URLS], { assets: false })],
      })
      return compiler
    })()
    return compilerPromise
  }

  /**
   * One compile pass in the requested output format.
   *
   * Never throws: a WASM-level failure (OOM, aborted worker, corrupt module) is
   * surfaced as an error diagnostic so the preview degrades to an error panel
   * instead of unmounting.
   */
  async function run(
    source: string,
    format: CompileFormatEnum,
  ): Promise<{ result?: Uint8Array; diagnostics: TypstDiagnostic[] }> {
    const compiler = await getCompiler()

    compiler.addSource(MAIN_FILE, source)

    try {
      const { result, diagnostics } = await compiler.compile({
        mainFilePath: MAIN_FILE,
        diagnostics: 'full',
        format,
      })

      return {
        result,
        diagnostics: (diagnostics ?? []).map((entry) => ({
          severity: toSeverity(entry.severity),
          message: entry.message,
          location: entry.range ?? '',
        })),
      }
    } catch (error) {
      return {
        diagnostics: [
          {
            severity: 'error',
            message:
              error instanceof Error ? error.message : 'Unknown compiler error',
            location: '',
          },
        ],
      }
    }
  }

  return {
    async compile(source: string): Promise<CompileOutput> {
      const { result, diagnostics } = await run(source, CompileFormatEnum.vector)

      return {
        artifact: result,
        diagnostics,
        hasError: !result || diagnostics.some((d) => d.severity === 'error'),
      }
    },

    async exportPdf(source: string): Promise<PdfOutput> {
      const { result, diagnostics } = await run(source, CompileFormatEnum.pdf)

      return {
        pdf: result,
        diagnostics,
        hasError: !result || diagnostics.some((d) => d.severity === 'error'),
      }
    },
  }
}