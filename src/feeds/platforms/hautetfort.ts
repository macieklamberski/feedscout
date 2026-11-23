import { hautetfort } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type HautetfortUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

const feeds = withHintLabels(hautetfort.feeds)

export const parseHautetfortUrl = (url: string): HautetfortUrl | undefined => {
  const page = hautetfort.pages.read(url)

  if (!page) {
    return
  }

  const { blog } = page.params

  if (page.key === 'category') {
    return { kind: 'category', blog, category: page.params.category }
  }

  return { kind: 'blog', blog }
}

export const hautetfortHandler: PlatformHandler = {
  match: (url) => {
    return parseHautetfortUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHautetfortUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // Blog subdomains serve no certificate for their own name, so the feeds stay on http.
    const params = { scheme: 'http' }

    if (parsed.kind === 'category') {
      return [
        page.getFeedEntry('category', { ...params, category: parsed.category }),
        page.getFeedEntry('posts', params, 'atom'),
        page.getFeedEntry('posts', params, 'rss'),
      ]
    }

    return [page.getFeedEntry('posts', params, 'atom'), page.getFeedEntry('posts', params, 'rss')]
  },

  getFeedHint: feeds.getFeedHint,
}
