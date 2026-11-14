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
// same items under the hub and user spellings below it, which readers store. A top listing is the
// same feed sorted, and a tag without its language prefix is the same tag. A subscription feed
// carries the reader's private token, so the table only claims it.
const feeds = definePlatformFeeds([
  { key: 'habr:articles', template: 'https://habr.com/{language}/rss/articles/' },
  { key: 'habr:articles', template: 'https://habr.com/{language}/rss/articles/top/' },
  { key: 'habr:articles', template: 'https://habr.com/{language}/rss/articles/top/{period}/' },
  { key: 'habr:news', template: 'https://habr.com/{language}/rss/news/' },
  { key: 'habr:news', template: 'https://habr.com/{language}/rss/news/top/{period}/' },
  { key: 'habr:hub-posts', template: 'https://habr.com/{language}/rss/hubs/{hub}/posts/' },
  { key: 'habr:flow', template: 'https://habr.com/{language}/rss/flows/{flow}/articles/' },
  { key: 'habr:tag', template: 'https://habr.com/{language}/rss/tag/{tag}/' },
  { key: 'habr:tag', template: 'https://habr.com/rss/tag/{tag}/' },
  {
    key: 'habr:search',
    template: 'https://habr.com/{language}/rss/search/?q={query}&target_type=posts',
  },
  { key: 'habr:comments', template: 'https://habr.com/{language}/rss/publications/{post}/' },
  { key: 'habr:subscriptions', template: 'https://habr.com/{language}/rss/feed/{token}/' },
  { key: 'habr:hub', template: 'https://habr.com/{language}/rss/hubs/{hub}/articles/' },
  {
    key: 'habr:hub',
    template: 'https://habr.com/{language}/rss/hubs/{hub}/articles/all/',
    isAlias: true,
  },
  { key: 'habr:hub', template: 'https://habr.com/{language}/rss/hub/{hub}/', isAlias: true },
  { key: 'habr:user', template: 'https://habr.com/{language}/rss/users/{username}/articles/' },
  {
    key: 'habr:user',
    template: 'https://habr.com/{language}/rss/users/{username}/posts/',
    isAlias: true,
  },
  {
    key: 'habr:user',
    template: 'https://habr.com/{language}/rss/users/{username}/publications/articles/',
    isAlias: true,
  },
  {
    key: 'habr:user',
    template: 'https://habr.com/{language}/rss/users/{username}/publications/posts/',
    isAlias: true,
  },
  {
    key: 'habr:company',
    template: 'https://habr.com/{language}/rss/companies/{company}/articles/',
  },
  {
    key: 'habr:company',
    template: 'https://habr.com/{language}/rss/companies/{company}/articles/all/',
    isAlias: true,
  },
  {
    key: 'habr:company',
    template: 'https://habr.com/{language}/rss/company/{company}/blog/',
    isAlias: true,
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

    if (parsed.kind === 'hub') {
      const params = { language: parsed.language, hub: parsed.hub }

      return [
        feeds.getFeedEntry('habr:hub', params),
        feeds.getFeedEntry('habr:hub-posts', params),
        feeds.getFeedEntry('habr:articles', { language: parsed.language }),
        feeds.getFeedEntry('habr:news', { language: parsed.language }),
      ]
    }

    if (parsed.kind === 'user') {
      const params = { language: parsed.language, username: parsed.username }

      return [
        feeds.getFeedEntry('habr:user', params),
        feeds.getFeedEntry('habr:articles', { language: parsed.language }),
        feeds.getFeedEntry('habr:news', { language: parsed.language }),
      ]
    }

    if (parsed.kind === 'company') {
      const params = { language: parsed.language, company: parsed.company }

      return [
        feeds.getFeedEntry('habr:company', params),
        feeds.getFeedEntry('habr:articles', { language: parsed.language }),
        feeds.getFeedEntry('habr:news', { language: parsed.language }),
      ]
    }

    return [
      feeds.getFeedEntry('habr:articles', { language: parsed.language }),
      feeds.getFeedEntry('habr:news', { language: parsed.language }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
