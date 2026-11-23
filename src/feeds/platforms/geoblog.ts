import { geoblog } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: trip.

export type GeoblogUrl = { kind: 'trip' } | { kind: 'entry' }

export type GeoblogPage = GeoblogUrl & { tripId: string }

const relativePathRegex = /^\/(?!\/)/

const feeds = withHintLabels(geoblog.feeds)

export const parseGeoblogUrl = (url: string): GeoblogUrl | undefined => {
  const page = geoblog.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'trip') {
    return { kind: 'trip' }
  }

  return { kind: 'entry' }
}

const getTripId = (url: string, href: string | undefined): string | undefined => {
  if (!href || !relativePathRegex.test(href)) {
    return
  }

  const page = geoblog.pages.read(parseUrl(href, url)?.href ?? '')

  if (page?.key !== 'trip') {
    return
  }

  return page.params.tripId
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
    return element.name === 'a' && getTripId(url, element.attribs.href) !== undefined
  })
  const tripId = getTripId(url, anchor?.attribs.href)

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

    return [pageFeeds.getFeedEntry('trip', { tripId: page.tripId })]
  },

  getFeedHint: feeds.getFeedHint,
}
