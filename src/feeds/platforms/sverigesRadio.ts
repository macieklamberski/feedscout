import { sverigesRadio } from 'feedintel'
import { getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { alphanumericOrHyphenRegex, digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: program.

export type SverigesRadioUrl =
  | { kind: 'legacyProgram'; programId: string }
  | { kind: 'program'; slug: string }

const hosts = sverigesRadio.hosts.exact

const feeds = withHintLabels(sverigesRadio.feeds)

export const parseSverigesRadioUrl = (url: string): SverigesRadioUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const programId = getQueryParam(parsedUrl.searchParams, 'programid')

  // Legacy pages such as /sida/default.aspx?programid={id} name the program by its id alone.
  if (programId && digitsRegex.test(programId)) {
    return { kind: 'legacyProgram', programId }
  }

  const [routeOrSlug, podcastSlug] = getPathSegments(parsedUrl)
  // Program pages redirect to /poddar/{program}.
  const slug = isAnyOf(routeOrSlug, 'poddar') && podcastSlug ? podcastSlug : routeOrSlug

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
      return [feeds.getFeedEntry('program', { programId: parsed.programId })]
    }

    return [feeds.getFeedEntry('program', { slug: parsed.slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
