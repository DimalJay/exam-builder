/**
 * Saving the compiled paper.
 *
 * Split out from the preview hook so the browser mechanics of a download --
 * object URLs, synthetic clicks, revoking -- live in one place rather than
 * being inlined into a component that should only be deciding *when* to export.
 */

/**
 * A filename derived from the paper title.
 *
 * Titles are free text: they contain slashes, colons and quotation marks that a
 * browser will either mangle or refuse outright, and Windows additionally
 * rejects `< > | "`. Everything outside the conservative set collapses to a
 * single hyphen. Falls back to a generic name so an untitled paper still
 * downloads rather than arriving as an extensionless file.
 */
export function pdfFileName(title: string): string {
  const stem =
    title
      .trim()
      .slice(0, 80)
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()

  return `${stem || 'exam-paper'}.pdf`
}

/**
 * Hand PDF bytes to the browser as a file download.
 *
 * The `Blob` constructor copies the WASM-owned buffer, so the caller is free to
 * reuse or drop the `Uint8Array` afterwards. The object URL is revoked on the
 * next tick rather than immediately: revoking it synchronously can cancel the
 * download before the browser has read the anchor.
 */
export function downloadPdf(pdf: Uint8Array, fileName: string): void {
  // Copied into a plain `Uint8Array` rather than passed straight through: the
  // compiler hands back a view that is only *typed* as possibly
  // SharedArrayBuffer-backed, and `Blob` rejects that. The copy also detaches
  // the blob from WASM memory the caller could otherwise reuse.
  const bytes = new Uint8Array(pdf)
  const url = URL.createObjectURL(
    new Blob([bytes], { type: 'application/pdf' }),
  )

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  // Not attached to the document: Firefox in particular ignores a click on a
  // detached anchor unless it is in the DOM, so it is added for the duration of
  // the click and removed straight after.
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}