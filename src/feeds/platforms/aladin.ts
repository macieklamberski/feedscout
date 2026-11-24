import { aladin } from 'feedintel'
import { isSameText } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findUrls } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: category.

export type AladinUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }

const feeds = withHintLabels(aladin.feeds)

export const parseAladinUrl = (url: string): AladinUrl | undefined => {
  const page = aladin.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', username: page.params.username, categoryId: page.params.categoryId }
  }

  return { kind: 'blog', username: page.params.username }
}

export type AladinPage = AladinUrl

// Usernames match in any case, and the page's alternate link spells the blog's own:
// `/CHANGBI/category/49178853` links `/changbi/rss`.
const getLinkedUsername = (content: string, username: string): string | undefined => {
  for (const url of findUrls(content)) {
    const feed = aladin.feeds.read(url)

    if (feed?.key === 'posts' && isSameText(feed.params.username, username)) {
      return feed.params.username
    }
  }
}

export const getAladinPage = (url: string, content: string | undefined): AladinPage | undefined => {
  const parsed = parseAladinUrl(url)

  if (!parsed) {
    return
  }

  const username = getLinkedUsername(content ?? '', parsed.username) ?? parsed.username

  return { ...parsed, username }
}

export const aladinHandler: PlatformHandler = {
  match: (url) => {
    return parseAladinUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getAladinPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'category') {
      // Only the blog's subscribe page links a category feed, as an http url that redirects here.
      return [
        feeds.getFeedEntry('category', {
          username: page.username,
          categoryId: page.categoryId,
        }),
        feeds.getFeedEntry('posts', { username: page.username }),
      ]
    }

    return [feeds.getFeedEntry('posts', { username: page.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
