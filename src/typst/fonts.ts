import bold from '@/assets/fonts/LibertinusSerif-Bold.otf'
import boldItalic from '@/assets/fonts/LibertinusSerif-BoldItalic.otf'
import italic from '@/assets/fonts/LibertinusSerif-Italic.otf'
import regular from '@/assets/fonts/LibertinusSerif-Regular.otf'
import semibold from '@/assets/fonts/LibertinusSerif-Semibold.otf'
import semiboldItalic from '@/assets/fonts/LibertinusSerif-SemiboldItalic.otf'
import notoSansBold from '@/assets/fonts/NotoSans-Bold.ttf'
import notoSansRegular from '@/assets/fonts/NotoSans-Regular.ttf'

/**
 * Font faces the paper is rendered with, resolved to hashed asset URLs.
 *
 * Typst embeds no fonts of its own. Registered with none, it lays the document
 * out as an empty page: no error, no warning, just a blank sheet of paper.
 *
 * The library's default is to download a font bundle from a CDN inside
 * `init()`, which costs several seconds and fails outright when the CDN is slow
 * or unreachable -- the preview then sits on "Compiling" forever. Serving the
 * faces locally keeps startup instant and offline-proof.
 *
 * Noto Sans is the document face; Libertinus Serif covers any serif fallback.
 */
export const FONT_URLS: readonly string[] = [
  notoSansRegular,
  notoSansBold,
  regular,
  bold,
  italic,
  boldItalic,
  semibold,
  semiboldItalic,
]
