import { getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { alphanumericOrHyphenRegex, digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers podcast, program (html).
// Handler needed for: programId.

export type SverigesRadioUrl =
  | { kind: 'legacyProgram'; programId: string }
  | { kind: 'program'; slug: string }

const hosts = ['sverigesradio.se', 'www.sverigesradio.se']

// A podcast feed on /api/rss/pod/{id}, with or without /itunes, mostly answers a 301 to the program
// feed on public-api.sr.se, and a few serve a podcast of their own. resolve builds neither.
const feeds = definePlatformFeeds([
  { key: 'sveriges-radio:program', template: 'https://api.sr.se/api/rss/program/{programId}' },
  // A format id filters the program's articles to one format, and no page links it.
  {
    key: 'sveriges-radio:program-format',
    template: 'https://api.sr.se/api/rss/program/{programId}?format={format}',
  },
  { key: 'sveriges-radio:program', template: 'https://public-api.sr.se/rss/{slug}' },
  { key: 'sveriges-radio:program', template: 'https://api.sr.se/api/rss/pod/{podId}' },
  { key: 'sveriges-radio:program', template: 'https://api.sr.se/api/rss/pod/itunes/{podId}' },
  // A group of programs, and a region's traffic reports, which no page the handler reads names.
  { key: 'sveriges-radio:group', template: 'https://api.sr.se/api/rss/group/{groupId}' },
  { key: 'sveriges-radio:traffic', template: 'https://api.sr.se/api/rss/traffic/{areaId}' },
])

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
      return [feeds.getFeedEntry('sveriges-radio:program', { programId: parsed.programId })]
    }

    return [feeds.getFeedEntry('sveriges-radio:program', { slug: parsed.slug })]
  },

  // An id on api.sr.se is digits, and a word in its place answers 400. A slug on public-api.sr.se
  // carries no dot, and a file such as robots.txt answers 404.
  getFeedHint: (url) => {
    const value = getPathSegments(url).at(-1)
    const valueRegex = isHostOf(url, 'public-api.sr.se') ? alphanumericOrHyphenRegex : digitsRegex

    if (!value || !valueRegex.test(value)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
