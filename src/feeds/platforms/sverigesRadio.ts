import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers program (html).
// Handler needed for: programId.

export type SverigesRadioUrl =
  | { kind: 'legacyProgram'; programId: string }
  | { kind: 'program'; slug: string }

const hosts = ['sverigesradio.se', 'www.sverigesradio.se']

const programIdRegex = /^\d+$/
const slugRegex = /^[a-z0-9-]+$/i

export const parseSverigesRadioUrl = (url: string): SverigesRadioUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const programId = parsedUrl.searchParams.get('programid')

  // Legacy pages such as /sida/default.aspx?programid={id} name the program by its id alone.
  if (programId && programIdRegex.test(programId)) {
    return { kind: 'legacyProgram', programId }
  }

  const [slug] = getPathSegments(parsedUrl)

  if (!slug || !slugRegex.test(slug)) {
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
