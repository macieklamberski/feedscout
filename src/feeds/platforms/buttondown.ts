import { buttondown } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ButtondownUrl = { kind: 'newsletter'; username: string }

const feeds = withHintLabels(buttondown.feeds)

export const parseButtondownUrl = (url: string): ButtondownUrl | undefined => {
  const page = buttondown.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'newsletter', username: page.values.username }
}

export const buttondownHandler: PlatformHandler = {
  match: (url) => {
    return parseButtondownUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseButtondownUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('newsletter', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
