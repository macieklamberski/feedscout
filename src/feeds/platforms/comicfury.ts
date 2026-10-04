import { getSubdomain, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

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

const comicRegex = /^[a-z0-9-]+$/i
const profilePathRegex = /^\/comicprofile\.php$/i
const readerPathRegex = /^\/read\/([^/]+)/i

const excludedSubdomains = ['www']

export const parseComicfuryUrl = (url: string): ComicfuryUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (!isHostOf(parsedUrl, hosts)) {
    const comic = getSubdomain(parsedUrl, domains)

    if (!comic || !comicRegex.test(comic) || isAnyOf(comic, excludedSubdomains)) {
      return
    }

    return { kind: 'comic', comic }
  }

  if (profilePathRegex.test(parsedUrl.pathname)) {
    const comic = parsedUrl.searchParams.get('url')

    if (!comic || !comicRegex.test(comic)) {
      return
    }

    return { kind: 'profile', comic }
  }

  const comic = parsedUrl.pathname.match(readerPathRegex)?.[1]

  if (!comic || !comicRegex.test(comic)) {
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

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'comic') {
      return [{ uri: `${new URL(url).origin}/rss`, hint: composeHint('comicfury:comic') }]
    }

    if (parsed.kind === 'profile') {
      // Every comic answers on thecomicseries.com, whichever of the domains it picked.
      const uri = `https://${parsed.comic}.thecomicseries.com/rss`

      return [{ uri, hint: composeHint('comicfury:comic') }]
    }

    const uri = `https://comicfury.com/read/${parsed.comic}/rss`

    return [{ uri, hint: composeHint('comicfury:reader') }]
  },
}
