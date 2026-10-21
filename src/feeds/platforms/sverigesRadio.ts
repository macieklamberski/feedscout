import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { alphanumericOrHyphenRegex, composeHint, digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers podcast, program (html).
// Handler needed for: programId.

export type SverigesRadioUrl =
  | { kind: 'legacyProgram'; programId: string }
  | { kind: 'program'; slug: string }

const hosts = ['sverigesradio.se', 'www.sverigesradio.se']

export const parseSverigesRadioUrl = (url: string): SverigesRadioUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const programId = parsedUrl.searchParams.get('programid')

  // Legacy pages such as /sida/default.aspx?programid={id} name the program by its id alone.
  if (programId && digitsRegex.test(programId)) {
    return { kind: 'legacyProgram', programId }
  }

  const [first, second] = getPathSegments(parsedUrl)
  // Program pages redirect to /poddar/{program}.
  const slug = isAnyOf(first, 'poddar') && second ? second : first

  if (!slug || !alphanumericOrHyphenRegex.test(slug)) {
    return
  }

  return { kind: 'program', slug }
}

export const sverigesRadioHandler: PlatformHandler = {
  match: (url) => {
    return parseSverigesRadioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSverigesRadioUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'legacyProgram') {
      return [
        {
          uri: `https://api.sr.se/api/rss/program/${parsed.programId}`,
          hint: composeHint('sveriges-radio:program'),
        },
      ]
    }

    // public-api.sr.se answers 404 to a slug with an uppercase letter.
    return [
      {
        uri: `https://public-api.sr.se/rss/${parsed.slug.toLowerCase()}`,
        hint: composeHint('sveriges-radio:program'),
      },
    ]
  },
}
