import { getPathSegments, getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers trip (html).
// Handler needed for: entry.

export type GeoblogUrl = { kind: 'trip' } | { kind: 'entry' }

export type GeoblogPage = GeoblogUrl & { tripId: string }

const domains = ['geoblog.pl']

const idRegex = /^\d+$/
const tripPathRegex = /^\/podroz\/(\d+)(?:\/|$)/i

// Wildcard DNS sends every label to the user farm. www is the portal, admin answers 401 and cdn is
// the image host.
const excludedSubdomains = ['admin', 'cdn', 'www']

export const parseGeoblogUrl = (url: string): GeoblogUrl | undefined => {
  const user = getSubdomain(url, domains)

  if (!user || user.includes('.') || isAnyOf(user, excludedSubdomains)) {
    return
  }

  const [section, id] = getPathSegments(url)

  if (!id || !idRegex.test(id)) {
    return
  }

  if (isAnyOf(section, 'podroz')) {
    return { kind: 'trip' }
  }

  if (isAnyOf(section, 'wpis')) {
    return { kind: 'entry' }
  }
}

// A trip feed answers 200 with an empty channel for any id on any user's host, so the trip comes
// from the page. Trip and entry pages link their own trip by a relative path, in the breadcrumb,
// and the user's other trips by absolute urls.
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

    if (!page) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/podroz/rss/${page.tripId}.xml`, hint: composeHint('geoblog:trip') }]
  },
}
