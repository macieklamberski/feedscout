import { tumblr } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, wwwBlog (html).
// Handler needed for: tagged.

export type TumblrUrl = { kind: 'blog'; blog: string } | { kind: 'tag'; blog: string; tag: string }

const feeds = withHintLabels(tumblr.feeds)

export const parseTumblrUrl = (url: string): TumblrUrl | undefined => {
  const page = tumblr.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'tag') {
    return { kind: 'tag', blog: page.values.blog, tag: page.values.tag }
  }

  return { kind: 'blog', blog: page.values.blog }
}

export const tumblrHandler: PlatformHandler = {
  match: (url) => {
    return parseTumblrUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTumblrUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    const blog = { blog: parsed.blog }

    // The blog's posts and podcast need no value from the page but its blog, so every page builds
    // them after its own feeds.
    if (parsed.kind === 'tag') {
      return [
        page.getFeedEntry('tag', { ...blog, tag: parsed.tag }),
        page.getFeedEntry('posts', blog),
        page.getFeedEntry('theme-posts', blog),
        page.getFeedEntry('podcast', blog),
      ]
    }

    return [
      page.getFeedEntry('posts', blog),
      page.getFeedEntry('theme-posts', blog),
      page.getFeedEntry('podcast', blog),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
