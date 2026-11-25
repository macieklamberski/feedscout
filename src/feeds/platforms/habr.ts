import { habr } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: articles, company, hub, news, user.
// Handler needed for: hub-posts.

export type HabrUrl =
  | { kind: 'hub'; hub: string }
  | { kind: 'user'; username: string }
  | { kind: 'company'; company: string }
  | { kind: 'article'; post: string; company?: string }
  | { kind: 'flow'; flow: string }
  | { kind: 'home' }

const feeds = withHintLabels(habr.feeds)

export const parseHabrUrl = (url: string): HabrUrl | undefined => {
  const page = habr.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'hub') {
    return { kind: 'hub', hub: page.params.hub }
  }

  if (page.key === 'user') {
    return { kind: 'user', username: page.params.username }
  }

  if (page.key === 'article') {
    return { kind: 'article', post: page.params.post, company: page.params.company }
  }

  if (page.key === 'company') {
    return { kind: 'company', company: page.params.company }
  }

  if (page.key === 'flow') {
    return { kind: 'flow', flow: page.params.flow }
  }

  return { kind: 'home' }
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
      const params = { hub: parsed.hub }

      return [
        feeds.getFeedEntry('hub', params),
        feeds.getFeedEntry('hub-posts', params),
        feeds.getFeedEntry('articles'),
        feeds.getFeedEntry('news'),
      ]
    }

    if (parsed.kind === 'user') {
      const params = { username: parsed.username }

      return [
        feeds.getFeedEntry('user', params),
        feeds.getFeedEntry('articles'),
        feeds.getFeedEntry('news'),
      ]
    }

    if (parsed.kind === 'company') {
      const params = { company: parsed.company }

      return [
        feeds.getFeedEntry('company', params),
        feeds.getFeedEntry('articles'),
        feeds.getFeedEntry('news'),
      ]
    }

    if (parsed.kind === 'article') {
      const params = { post: parsed.post }

      if (parsed.company) {
        return [
          feeds.getFeedEntry('comments', params),
          feeds.getFeedEntry('company', { company: parsed.company }),
          feeds.getFeedEntry('articles'),
          feeds.getFeedEntry('news'),
        ]
      }

      return [
        feeds.getFeedEntry('comments', params),
        feeds.getFeedEntry('articles'),
        feeds.getFeedEntry('news'),
      ]
    }

    if (parsed.kind === 'flow') {
      const params = { flow: parsed.flow }

      return [
        feeds.getFeedEntry('flow', params),
        feeds.getFeedEntry('articles'),
        feeds.getFeedEntry('news'),
      ]
    }

    return [feeds.getFeedEntry('articles'), feeds.getFeedEntry('news')]
  },

  getFeedHint: feeds.getFeedHint,
}
