import {
  createTypstRenderer,
  type TypstRenderer,
} from '@myriaddreamin/typst.ts'
// See the note in browserEngine.ts: the wasm URL must be supplied explicitly.
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/wasm?url'

/**
 * Lazy, process-wide access to the Typst renderer.
 *
 * Kept separate from the preview hook so the renderer is created once per app
 * rather than per mount, and so `useTypstPreview` does not need to know how the
 * renderer is constructed.
 */
let rendererPromise: Promise<TypstRenderer> | null = null

export function getTypstRenderer(): Promise<TypstRenderer> {
  rendererPromise ??= (async () => {
    const renderer = createTypstRenderer()
    await renderer.init({ getModule: () => rendererWasmUrl })
    return renderer
  })()

  return rendererPromise
}