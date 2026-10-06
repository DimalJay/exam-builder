import type { ExamDocument } from '@/domain/exam'

/**
 * Saving the paper, in any of its export formats.
 *
 * Split out from the preview hook so the browser mechanics of a download --
 * object URLs, synthetic clicks, revoking -- live in one place rather than
 * being inlined into a component that should only be deciding *when* to export.
 */

/**
 * A file stem derived from the paper title.
 *
 * Titles are free text: they contain slashes, colons and quotation marks that a
 * browser will either mangle or refuse outright, and Windows additionally
 * rejects `< > | "`. Everything outside the conservative set collapses to a
 * single hyphen. Falls back to a generic stem so an untitled paper still
 * downloads rather than arriving as an extensionless file.
 */
export function fileStem(title: string): string {
  const stem = title
    .trim()
    .slice(0, 80)
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return stem || 'exam-paper'
}

/** A `.pdf` filename derived from the paper title, kept for callers that ask for the PDF form only. */
export function pdfFileName(title: string): string {
  return `${fileStem(title)}.pdf`
}

/**
 * Hand file bytes to the browser as a download.
 *
 * The object URL is revoked on the next tick rather than immediately: revoking
 * it synchronously can cancel the download before the browser has read the
 * anchor.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)

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

/**
 * Hand PDF bytes to the browser as a file download.
 *
 * The `Blob` constructor copies the WASM-owned buffer, so the caller is free to
 * reuse or drop the `Uint8Array` afterwards.
 */
export function downloadPdf(pdf: Uint8Array, fileName: string): void {
  // Copied into a plain `Uint8Array` rather than passed straight through: the
  // compiler hands back a view that is only *typed* as possibly
  // SharedArrayBuffer-backed, and `Blob` rejects that. The copy also detaches
  // the blob from WASM memory the caller could otherwise reuse.
  const bytes = new Uint8Array(pdf)
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), fileName)
}

/** Serialises the document so it can be re-imported later. */
export function downloadJson(document: ExamDocument, fileName: string): void {
  downloadBlob(
    new Blob([`${JSON.stringify(document, null, 2)}\n`], {
      type: 'application/json',
    }),
    fileName,
  )
}

/** Saves any plain text, e.g. the Typst source. */
export function downloadText(text: string, fileName: string): void {
  downloadBlob(
    new Blob([text], { type: 'text/plain;charset=utf-8' }),
    fileName,
  )
}