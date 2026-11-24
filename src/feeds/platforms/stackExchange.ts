import { stackExchange } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: question.
// Handler needed for: collective, newest, tag, user.

export type StackExchangeUrl =
  | { kind: 'tag'; tag: string; sort?: string }
  | { kind: 'question'; questionId: string }
  | { kind: 'user'; userId: string }
  | { kind: 'collective'; collective: string }
  | { kind: 'home' }

const feeds = withHintLabels(stackExchange.feeds)

export const parseStackExchangeUrl = (url: string): StackExchangeUrl | undefined => {
  const page = stackExchange.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag: page.params.tag, sort: page.params.sort }
  }

  if (page.key === 'question') {
    return { kind: 'question', questionId: page.params.questionId }
  }

  if (page.key === 'user') {
    return { kind: 'user', userId: page.params.userId }
  }

  if (page.key === 'collective') {
    return { kind: 'collective', collective: page.params.collective }
  }

  return { kind: 'home' }
}

export const stackExchangeHandler: PlatformHandler = {
  match: (url) => {
    return parseStackExchangeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseStackExchangeUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // The newest questions feed needs no value from the page, so every page builds it after its own
    // feeds.
    if (parsed.kind === 'tag') {
      return [
        page.getFeedEntry('tag', { tag: parsed.tag, sort: parsed.sort }),
        page.getFeedEntry('newest'),
      ]
    }

    if (parsed.kind === 'question') {
      return [
        page.getFeedEntry('question', { questionId: parsed.questionId }),
        page.getFeedEntry('newest'),
      ]
    }

    if (parsed.kind === 'user') {
      return [page.getFeedEntry('user', { userId: parsed.userId }), page.getFeedEntry('newest')]
    }

    if (parsed.kind === 'collective') {
      return [
        page.getFeedEntry('collective', { collective: parsed.collective }),
        page.getFeedEntry('newest'),
      ]
    }

    return [page.getFeedEntry('newest')]
  },

  getFeedHint: feeds.getFeedHint,
}
