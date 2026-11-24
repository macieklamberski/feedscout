import { habr } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

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

const feeds = withHintLabels(habr.feeds)

export const parseHabrUrl = (url: string): HabrUrl | undefined => {
  const page = habr.pages.read(url)

  if (!page) {
    return
  }

  // A page without a language prefix is the Russian site.
  const language = page.params.language ?? 'ru'

  if (page.key === 'hub') {
    return { kind: 'hub', language, hub: page.params.hub }
  }

  if (page.key === 'user') {
    return { kind: 'user', language, username: page.params.username }
  }

  if (page.key === 'article') {
    return { kind: 'article', language, post: page.params.post, company: page.params.company }
  }

  if (page.key === 'company') {
    return { kind: 'company', language, company: page.params.company }
  }

  if (page.key === 'flow') {
    return { kind: 'flow', language, flow: page.params.flow }
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
