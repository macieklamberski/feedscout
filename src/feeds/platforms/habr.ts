import { getAnyOf, getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HabrUrl =
  | { kind: 'hub'; language: string; hub: string }
  | { kind: 'user'; language: string; username: string }
  | { kind: 'company'; language: string; company: string }
  | { kind: 'home'; language: string }

const hosts = ['habr.com', 'www.habr.com']

const hubRegex = /^(?:\/[a-z]{2})?\/hubs?\/([^/]+)/i
const userRegex = /^(?:\/[a-z]{2})?\/users\/([^/]+)/i
const companyRegex = /^(?:\/[a-z]{2})?\/compan(?:y|ies)\/([^/]+)/i

const languages = ['ru', 'en']

export const parseHabrUrl = (url: string): HabrUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const [first] = getPathSegments(parsedUrl)
  const language = getAnyOf(first, languages) ?? 'ru'
  const hub = pathname.match(hubRegex)?.[1]

  if (hub) {
    return { kind: 'hub', language, hub }
  }

  const username = pathname.match(userRegex)?.[1]

  if (username) {
    return { kind: 'user', language, username }
  }

  const company = pathname.match(companyRegex)?.[1]

  if (company) {
    return { kind: 'company', language, company }
  }

  return { kind: 'home', language }
}

export const habrHandler: PlatformHandler = {
  match: (url) => {
    return parseHabrUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHabrUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const base = `${origin}/${parsed.language}/rss`
    const articles: DiscoverUriEntry = {
      uri: `${base}/articles/`,
      hint: composeHint('habr:articles'),
    }

    if (parsed.kind === 'hub') {
      return [{ uri: `${base}/hub/${parsed.hub}/`, hint: composeHint('habr:hub') }, articles]
    }

    if (parsed.kind === 'user') {
      return [
        { uri: `${base}/users/${parsed.username}/posts/`, hint: composeHint('habr:user') },
        articles,
      ]
    }

    if (parsed.kind === 'company') {
      return [
        {
          uri: `${base}/companies/${parsed.company}/articles/`,
          hint: composeHint('habr:company'),
        },
        articles,
      ]
    }

    return [articles]
  },
}
