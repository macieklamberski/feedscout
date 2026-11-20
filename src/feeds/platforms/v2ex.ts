import { v2ex } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type V2exUrl =
  | { kind: 'node'; node: string }
  | { kind: 'member'; username: string }
  | { kind: 'tab'; tab: string }
  | { kind: 'home' }

const feeds = withHintLabels(v2ex.feeds)

export const parseV2exUrl = (url: string): V2exUrl | undefined => {
  const page = v2ex.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'node') {
    return { kind: 'node', node: page.params.node }
  }

  if (page.key === 'member') {
    return { kind: 'member', username: page.params.username }
  }

  if (page.key === 'tab') {
    return { kind: 'tab', tab: page.params.tab }
  }

  return { kind: 'home' }
}

export const v2exHandler: PlatformHandler = {
  match: (url) => {
    return parseV2exUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseV2exUrl(url)

    if (!parsed) {
      return []
    }

    // The index feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'node') {
      return [feeds.getFeedEntry('node', { node: parsed.node }), feeds.getFeedEntry('index')]
    }

    if (parsed.kind === 'member') {
      return [
        feeds.getFeedEntry('member', { username: parsed.username }),
        feeds.getFeedEntry('index'),
      ]
    }

    if (parsed.kind === 'tab') {
      return [feeds.getFeedEntry('tab', { tab: parsed.tab }), feeds.getFeedEntry('index')]
    }

    return [feeds.getFeedEntry('index')]
  },

  getFeedHint: feeds.getFeedHint,
}
