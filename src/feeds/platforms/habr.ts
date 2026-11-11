import { getAnyOf, getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type HabrUrl =
  | { kind: 'hub'; language: string; hub: string }
  | { kind: 'user'; language: string; username: string }
  | { kind: 'company'; language: string; company: string }
  | { kind: 'home'; language: string }

const hosts = ['habr.com', 'www.habr.com']

const languages = ['ru', 'en']
const languagePrefix = `(?:/(?:${languages.join('|')}))?`

const hubRegex = new RegExp(`^${languagePrefix}/hubs?/([^/]+)`, 'i')
const userRegex = new RegExp(`^${languagePrefix}/users/([^/]+)`, 'i')
const companyRegex = new RegExp(`^${languagePrefix}/compan(?:y|ies)/([^/]+)`, 'i')

// The first row of a key is the feed `resolve` emits, the one Habr's pages link. Habr serves the
// same items under the hub and user spellings below it, which readers store.
const feeds = definePlatformFeeds([
  { key: 'habr:articles', template: 'https://habr.com/{language}/rss/articles/' },
  { key: 'habr:hub', template: 'https://habr.com/{language}/rss/hubs/{hub}/articles/' },
  { key: 'habr:hub', template: 'https://habr.com/{language}/rss/hubs/{hub}/articles/all/' },
  { key: 'habr:hub', template: 'https://habr.com/{language}/rss/hub/{hub}/' },
  { key: 'habr:user', template: 'https://habr.com/{language}/rss/users/{username}/articles/' },
  { key: 'habr:user', template: 'https://habr.com/{language}/rss/users/{username}/posts/' },
  {
    key: 'habr:user',
    template: 'https://habr.com/{language}/rss/users/{username}/publications/articles/',
  },
  {
    key: 'habr:company',
    template: 'https://habr.com/{language}/rss/companies/{company}/articles/',
  },
])

export const parseHabrUrl = (url: string): HabrUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const [languageOrRoute] = getPathSegments(parsedUrl)
  const language = getAnyOf(languageOrRoute, languages) ?? 'ru'
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

    const articles = feeds.getFeedEntry('habr:articles', { language: parsed.language })

    if (parsed.kind === 'hub') {
      const params = { language: parsed.language, hub: parsed.hub }

      return [feeds.getFeedEntry('habr:hub', params), articles]
    }

    if (parsed.kind === 'user') {
      const params = { language: parsed.language, username: parsed.username }

      return [feeds.getFeedEntry('habr:user', params), articles]
    }

    if (parsed.kind === 'company') {
      const params = { language: parsed.language, company: parsed.company }

      return [feeds.getFeedEntry('habr:company', params), articles]
    }

    return [articles]
  },

  getFeedKey: feeds.getFeedKey,
}
