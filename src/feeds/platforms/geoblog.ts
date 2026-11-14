import { getPathSegments, isAnyOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, findElement, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers trip (html).
// Handler needed for: entry.

export type GeoblogUrl = { kind: 'trip' } | { kind: 'entry' }

export type GeoblogPage = GeoblogUrl & { tripId: string }

const domains = ['geoblog.pl']

const tripPathRegex = /^\/podroz\/(\d+)(?:\/|$)/i

const feeds = definePlatformFeeds(
  [{ key: 'geoblog:trip', template: '{scheme}://{host}/podroz/rss/{tripId}.xml' }],
  { domains },
)

export const parseGeoblogUrl = (url: string): GeoblogUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  const [section, id] = getPathSegments(url)

  if (!id || !digitsRegex.test(id)) {
    return
  }

  if (isAnyOf(section, 'podroz')) {
    return { kind: 'trip' }
  }

  if (isAnyOf(section, 'wpis')) {
    return { kind: 'entry' }
  }
}

// A trip feed answers on any user's host, under that user's name, so the trip comes from the page.
// Trip and entry pages link their own trip by a relative path, in the breadcrumb, and the user's
// other trips by absolute urls.
const getGeoblogPage = (url: string, content: string | undefined): GeoblogPage | undefined => {
  const parsed = parseGeoblogUrl(url)

  if (!parsed) {
    return
  }

  const anchor = findElement(content, (element) => {
    return element.name === 'a' && tripPathRegex.test(element.attribs.href ?? '')
  })
  const tripId = tripPathRegex.exec(anchor?.attribs.href ?? '')?.[1]

  if (!tripId) {
    return
  }

  return { ...parsed, tripId }
}

export const geoblogHandler: PlatformHandler = {
  match: (url, content) => {
    return getGeoblogPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getGeoblogPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('geoblog:trip', { tripId: page.tripId })]
  },

  getFeedHint: feeds.getFeedHint,
}
