import { getQueryParam, getRegistrableDomain, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { alphanumericOrHyphenRegex, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers comic, reader (guess, html).
// Handler needed for: profile.

export type ComicfuryUrl = { kind: 'comic' | 'profile' | 'reader'; comic: string }

const domains = [
  'thecomicseries.com',
  'thecomicstrip.org',
  'the-comic.org',
  'webcomic.ws',
  'cfw.me',
]
const hosts = ['comicfury.com', 'www.comicfury.com']

const profilePathRegex = /^\/comicprofile\.php$/i
const readerPathRegex = /^\/read\/([^/]+)/i

const feeds = definePlatformFeeds(
  [
    { key: 'comicfury:comic', template: 'https://{comic}.{domain}/rss' },
    { key: 'comicfury:reader', template: 'https://comicfury.com/read/{comic}/rss' },
  ],
  { domains },
)

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

  if (profilePathRegex.test(parsedUrl.pathname)) {
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
    const domain = getRegistrableDomain(url)

    if (!parsed || !domain) {
      return []
    }

    if (parsed.kind === 'comic') {
      return [feeds.getFeedEntry('comicfury:comic', { comic: parsed.comic, domain })]
    }

    if (parsed.kind === 'profile') {
      // Every comic answers on thecomicseries.com, whichever of the domains it picked.
      const params = { comic: parsed.comic, domain: 'thecomicseries.com' }

      return [feeds.getFeedEntry('comicfury:comic', params)]
    }

    return [feeds.getFeedEntry('comicfury:reader', { comic: parsed.comic })]
  },

  // The table reads any label or segment as a comic, the parser only a valid comic name.
  getFeedHint: (url) => {
    if (!parseComicfuryUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
