import { pleroma } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getScriptText, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler adds formats for: posts (rss).

export type PleromaUrl = { kind: 'profile'; username: string }

const apiPath = '/api/pleroma/'

const feeds = withHintLabels(pleroma.feeds)

// The frontend preloads its config from the API, and older releases inline that response in the
// `initial-results` script, keyed by its path.
export const isPleromaHtml = (content: string): boolean => {
  const preload = findElement(content, (element) => {
    return element.name === 'link' && (element.attribs.href ?? '').startsWith(apiPath)
  })

  if (preload) {
    return true
  }

  return getScriptText(content, 'initial-results')?.includes(`"${apiPath}`) ?? false
}

export const parsePleromaUrl = (url: string): PleromaUrl | undefined => {
  const page = pleroma.pages.read(url, { root: parseUrl(url)?.origin ?? '' })

  if (!page) {
    return
  }

  return { kind: 'profile', username: page.params.username }
}

export const pleromaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isPleromaHtml })) {
      return false
    }

    return parsePleromaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePleromaUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    const params = { username: parsed.username }

    return [
      pageFeeds.getFeedEntry('posts', params, 'atom'),
      pageFeeds.getFeedEntry('posts', params, 'rss'),
    ]
  },
}
