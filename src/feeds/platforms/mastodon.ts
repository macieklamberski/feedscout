import { mastodon } from 'feedintel'
import { includesAnyOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasClass, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: tagged.
// Handler needed for: media, posts, replies, tag.

export type MastodonUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'replies'; username: string }
  | { kind: 'media'; username: string }
  | { kind: 'tagged'; username: string; tag: string }
  | { kind: 'tag'; tag: string }

const feeds = withHintLabels(mastodon.feeds)

// Current Mastodon serves no generator meta, so the `<div class="app-holder" id="mastodon">` app
// root is matched too. A bare `mastodon` id is a common social-link id on blogs.
export const isMastodonHtml = (content: string): boolean => {
  if (hasMetaContent(content, 'generator', 'Mastodon')) {
    return true
  }

  const appRoot = findElement(content, (element) => {
    return element.name === 'div' && element.attribs.id === 'mastodon'
  })

  return hasClass(appRoot, 'app-holder')
}

export const isMastodonHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('server'), 'mastodon')
}

export const parseMastodonUrl = (url: string): MastodonUrl | undefined => {
  const page = mastodon.pages.read(url, { root: parseUrl(url)?.origin ?? '' })

  if (!page) {
    return
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag: page.params.tag }
  }

  const { username } = page.params

  if (page.key === 'replies') {
    return { kind: 'replies', username }
  }

  if (page.key === 'media') {
    return { kind: 'media', username }
  }

  if (page.key === 'tagged') {
    return { kind: 'tagged', username, tag: page.params.tag }
  }

  return { kind: 'profile', username }
}

export const mastodonHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!parseMastodonUrl(url)) {
      return false
    }

    return hasMarker(content, headers, { html: isMastodonHtml, headers: isMastodonHeaders })
  },

  resolve: (url) => {
    const parsed = parseMastodonUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    if (parsed.kind === 'replies') {
      return [
        pageFeeds.getFeedEntry('replies', { username: parsed.username }),
        pageFeeds.getFeedEntry('posts', { username: parsed.username }),
      ]
    }

    if (parsed.kind === 'media') {
      return [
        pageFeeds.getFeedEntry('media', { username: parsed.username }),
        pageFeeds.getFeedEntry('posts', { username: parsed.username }),
      ]
    }

    if (parsed.kind === 'tagged') {
      return [
        pageFeeds.getFeedEntry('tagged', { username: parsed.username, tag: parsed.tag }),
        pageFeeds.getFeedEntry('posts', { username: parsed.username }),
      ]
    }

    if (parsed.kind === 'profile') {
      return [pageFeeds.getFeedEntry('posts', { username: parsed.username })]
    }

    return [pageFeeds.getFeedEntry('tag', { tag: parsed.tag })]
  },
}
