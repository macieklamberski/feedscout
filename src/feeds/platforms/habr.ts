import { habr } from 'feedintel'
import { isHostOf, isLocale, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: articles, company, hub, news, user.
// Handler needed for: hub-posts.

export type HabrUrl =
  | { kind: 'hub'; language: string; hub: string }
  | { kind: 'user'; language: string; username: string }
  | { kind: 'company'; language: string; company: string }
  | { kind: 'article'; language: string; post: string; company?: string }
  | { kind: 'flow'; language: string; flow: string }
  | { kind: 'home'; language: string }

const hosts = habr.hosts.exact

const languagePrefixRegex = /^\/([^/]+)(.*)$/
const hubRegex = /^\/hubs?\/([^/]+)/i
const userRegex = /^\/users\/([^/]+)/i
const companyRegex = /^\/compan(?:y|ies)\/([^/]+)/i
const articleRegex =
  /^(?:\/compan(?:y|ies)\/(?<company>[^/]+))?\/(?:articles|blog|news|posts?)\/(?<post>[^/]+)/i
const flowRegex = /^\/flows\/([^/]+)/i

const feeds = withHintLabels(habr.feeds)

export const parseHabrUrl = (url: string): HabrUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  // A page without a language prefix is the Russian site.
  const [, prefix = '', rest = ''] = parsedUrl.pathname.match(languagePrefixRegex) ?? []
  const hasLanguage = isLocale(prefix)
  const language = hasLanguage ? prefix : 'ru'
  const pathname = hasLanguage ? rest : parsedUrl.pathname
  const hub = pathname.match(hubRegex)?.[1]

  if (hub) {
    return { kind: 'hub', language, hub }
  }

  const username = pathname.match(userRegex)?.[1]

  if (username) {
    return { kind: 'user', language, username }
  }

  // A company article sits under the company, so it is read before the company page.
  const article = pathname.match(articleRegex)?.groups

  if (article?.post && digitsRegex.test(article.post)) {
    return { kind: 'article', language, post: article.post, company: article.company }
  }

  const company = pathname.match(companyRegex)?.[1]

  if (company) {
    return { kind: 'company', language, company }
  }

  const flow = pathname.match(flowRegex)?.[1]

  if (flow) {
    return { kind: 'flow', language, flow }
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
        feeds.getFeedEntry('hub', params),
        feeds.getFeedEntry('hub-posts', params),
        feeds.getFeedEntry('articles', { language: parsed.language }),
        feeds.getFeedEntry('news', { language: parsed.language }),
      ]
    }

    if (parsed.kind === 'user') {
      const params = { language: parsed.language, username: parsed.username }

      return [
        feeds.getFeedEntry('user', params),
        feeds.getFeedEntry('articles', { language: parsed.language }),
        feeds.getFeedEntry('news', { language: parsed.language }),
      ]
    }

    if (parsed.kind === 'company') {
      const params = { language: parsed.language, company: parsed.company }

      return [
        feeds.getFeedEntry('company', params),
        feeds.getFeedEntry('articles', { language: parsed.language }),
        feeds.getFeedEntry('news', { language: parsed.language }),
      ]
    }

    if (parsed.kind === 'article') {
      const params = { language: parsed.language, post: parsed.post }

      if (parsed.company) {
        return [
          feeds.getFeedEntry('comments', params),
          feeds.getFeedEntry('company', {
            language: parsed.language,
            company: parsed.company,
          }),
          feeds.getFeedEntry('articles', { language: parsed.language }),
          feeds.getFeedEntry('news', { language: parsed.language }),
        ]
      }

      return [
        feeds.getFeedEntry('comments', params),
        feeds.getFeedEntry('articles', { language: parsed.language }),
        feeds.getFeedEntry('news', { language: parsed.language }),
      ]
    }

    if (parsed.kind === 'flow') {
      const params = { language: parsed.language, flow: parsed.flow }

      return [
        feeds.getFeedEntry('flow', params),
        feeds.getFeedEntry('articles', { language: parsed.language }),
        feeds.getFeedEntry('news', { language: parsed.language }),
      ]
    }

    return [
      feeds.getFeedEntry('articles', { language: parsed.language }),
      feeds.getFeedEntry('news', { language: parsed.language }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
