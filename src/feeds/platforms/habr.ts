import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HabrUrl =
  | { kind: 'hub'; hub: string }
  | { kind: 'user'; username: string }
  | { kind: 'company'; company: string }

const hosts = ['habr.com', 'www.habr.com']
const languages = ['ru', 'en']
const hubRegex = /\/hubs?\/([^/]+)/
const userRegex = /\/users\/([^/]+)/
const companyRegex = /\/compan(?:y|ies)\/([^/]+)/

const getLanguage = (url: string): string => {
  const [first] = getPathSegments(url)

  if (first && languages.includes(first)) {
    return first
  }

  return 'ru'
}

export const parseHabrUrl = (url: string): HabrUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const hub = pathname.match(hubRegex)?.[1]

  if (hub) {
    return { kind: 'hub', hub }
  }

  const username = pathname.match(userRegex)?.[1]

  if (username) {
    return { kind: 'user', username }
  }

  const company = pathname.match(companyRegex)?.[1]

  if (company) {
    return { kind: 'company', company }
  }
}

export const habrHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    if (!isHostOf(url, hosts)) {
      return []
    }

    const { origin } = new URL(url)
    const parsed = parseHabrUrl(url)
    const base = `${origin}/${getLanguage(url)}/rss`
    const uris: Array<DiscoverUriEntry> = []

    if (parsed?.kind === 'hub') {
      uris.push({ uri: `${base}/hub/${parsed.hub}/`, hint: composeHint('habr:hub') })
    }

    if (parsed?.kind === 'user') {
      uris.push({ uri: `${base}/users/${parsed.username}/posts/`, hint: composeHint('habr:user') })
    }

    if (parsed?.kind === 'company') {
      uris.push({
        uri: `${base}/companies/${parsed.company}/articles/`,
        hint: composeHint('habr:company'),
      })
    }

    uris.push({ uri: `${base}/articles/`, hint: composeHint('habr:articles') })

    return uris
  },
}
