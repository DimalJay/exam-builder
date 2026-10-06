import bold from '@/assets/fonts/LibertinusSerif-Bold.otf'
import boldItalic from '@/assets/fonts/LibertinusSerif-BoldItalic.otf'
import italic from '@/assets/fonts/LibertinusSerif-Italic.otf'
import regular from '@/assets/fonts/LibertinusSerif-Regular.otf'
import semibold from '@/assets/fonts/LibertinusSerif-Semibold.otf'
import semiboldItalic from '@/assets/fonts/LibertinusSerif-SemiboldItalic.otf'
import notoSansBold from '@/assets/fonts/NotoSans-Bold.ttf'
import notoSansRegular from '@/assets/fonts/NotoSans-Regular.ttf'
import timesBold from '@/assets/fonts/TimesNewRoman-Bold.ttf'
import timesBoldItalic from '@/assets/fonts/TimesNewRoman-BoldItalic.ttf'
import timesItalic from '@/assets/fonts/TimesNewRoman-Italic.ttf'
import timesRegular from '@/assets/fonts/TimesNewRoman-Regular.ttf'

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
 * Times New Roman is the paper face (header, body, watermark and footer alike);
 * Noto Sans is the optional sans face, and Libertinus Serif covers any serif
 * fallback glyph Times is missing.
 *
 * Note: the Times New Roman files come from this machine's `C:\Windows\Fonts`
 * and are NOT redistributable -- keep them out of any public repository.
 */
export const FONT_URLS: readonly string[] = [
  timesRegular,
  timesBold,
  timesItalic,
  timesBoldItalic,
  notoSansRegular,
  notoSansBold,
  regular,
  bold,
  italic,
  boldItalic,
  semibold,
  semiboldItalic,
]
