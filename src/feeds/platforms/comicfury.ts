import { comicfury } from 'feedintel'
import { getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { alphanumericOrHyphenRegex, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: reader.
// Handler needed for: comic.

export type ComicfuryUrl = { kind: 'comic' | 'profile' | 'reader'; comic: string }

const domains = comicfury.hosts.tenants
const hosts = comicfury.hosts.exact

const readerPathRegex = /^\/read\/([^/]+)/i

const feeds = withHintLabels(comicfury.feeds)

export const parseComicfuryUrl = (url: string): ComicfuryUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (!isHostOf(parsedUrl, hosts)) {
    const comic = getTenantSubdomain(parsedUrl, domains)

    if (!comic || !alphanumericOrHyphenRegex.test(comic)) {
      return
    }

    return { kind: 'comic', comic }
  }

  if (isAnyOf(parsedUrl.pathname, '/comicprofile.php')) {
    const comic = getQueryParam(parsedUrl.searchParams, 'url')

    if (!comic || !alphanumericOrHyphenRegex.test(comic)) {
      return
    }

    return { kind: 'profile', comic }
  }

  const comic = parsedUrl.pathname.match(readerPathRegex)?.[1]

  if (!comic || !alphanumericOrHyphenRegex.test(comic)) {
    return
  }

  return { kind: 'reader', comic }
}

export const comicfuryHandler: PlatformHandler = {
  match: (url) => {
    return parseComicfuryUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseComicfuryUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'comic') {
      return [page.getFeedEntry('comic')]
    }

    if (parsed.kind === 'profile') {
      // Every comic answers on thecomicseries.com, whichever of the domains it picked.
      const params = { host: `${parsed.comic}.thecomicseries.com` }

      return [page.getFeedEntry('comic', params)]
    }

    return [page.getFeedEntry('reader', { comic: parsed.comic })]
  },

  // The table reads any label or segment as a comic, the parser only a valid comic name.
  getFeedHint: (url) => {
    if (!parseComicfuryUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
