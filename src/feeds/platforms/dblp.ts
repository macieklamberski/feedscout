import { encodePathSegment, getAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, formatSuffixRegex } from '../../common/utils.js'

// Discoverability: Unmeasured, bot wall.

export type DblpUrl =
  | { kind: 'venue'; venueType: string; venue: string }
  | { kind: 'person'; group: string; personId: string }
  | { kind: 'home' }

const hosts = ['dblp.org']

// Record, venue and stream pages all name the venue as `{type}/{venue}`.
const venueRegex = /^\/(?:rec|db|streams)\/([^/]+)\/([^/.]+)(?:\/|$)/i
const personRegex = /^\/pid\/([^/]+)\/([^/]+)/i

const venueTypes = ['conf', 'journals']

export const parseDblpUrl = (url: string): DblpUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const venueMatch = pathname.match(venueRegex)
  const venueType = getAnyOf(venueMatch?.[1], venueTypes)
  const venue = venueMatch?.[2]

  if (venueType && venue) {
    return { kind: 'venue', venueType, venue }
  }

  const personMatch = pathname.match(personRegex)

  if (personMatch) {
    const personId = personMatch[2].replace(formatSuffixRegex, '')

    return { kind: 'person', group: personMatch[1], personId }
  }

  return { kind: 'home' }
}

export const dblpHandler: PlatformHandler = {
  match: (url) => {
    return parseDblpUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDblpUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    if (parsed.kind === 'venue') {
      const venue = encodePathSegment(parsed.venue)

      return [
        {
          uri: `${origin}/feed/streams/${parsed.venueType}/${venue}.rss`,
          hint: composeHint('dblp:venue'),
        },
      ]
    }

    if (parsed.kind === 'person') {
      const group = encodePathSegment(parsed.group)
      const personId = encodePathSegment(parsed.personId)

      return [{ uri: `${origin}/pid/${group}/${personId}.rss`, hint: composeHint('dblp:person') }]
    }

    return [{ uri: `${origin}/feed/new.rss`, hint: composeHint('dblp:updates') }]
  },
}
