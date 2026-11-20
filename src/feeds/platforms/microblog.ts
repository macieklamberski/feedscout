import { microblog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: category, posts.
// Handler needed for: archive, photos, podcast.

export type MicroblogUrl =
  | { kind: 'category'; username: string; category: string }
  | { kind: 'archive'; username: string }
  | { kind: 'photos'; username: string }
  | { kind: 'blog'; username: string }

export const domains = microblog.hosts.tenants

const feeds = withHintLabels(microblog.feeds)

export const parseMicroblogUrl = (url: string): MicroblogUrl | undefined => {
  const page = microblog.pages.read(url)
  const username = getTenantSubdomain(url, domains)

  if (!page || !username) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', username, category: page.params.category }
  }

  if (page.key === 'archive') {
    return { kind: 'archive', username }
  }

  if (page.key === 'photos') {
    return { kind: 'photos', username }
  }

  return { kind: 'blog', username }
}

export const microblogHandler: PlatformHandler = {
  match: (url) => {
    return parseMicroblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMicroblogUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // The posts, podcast, archive and photos feeds need no value from the page, so every page
    // builds them after its own feeds.
    if (parsed.kind === 'category') {
      const params = { category: parsed.category }

      return [
        page.getFeedEntry('category', params, 'rss'),
        page.getFeedEntry('category', params, 'json'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'json'),
        page.getFeedEntry('podcast', {}, 'rss'),
        page.getFeedEntry('podcast', {}, 'json'),
        page.getFeedEntry('archive'),
        page.getFeedEntry('photos'),
      ]
    }

    if (parsed.kind === 'archive') {
      return [
        page.getFeedEntry('archive'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'json'),
        page.getFeedEntry('podcast', {}, 'rss'),
        page.getFeedEntry('podcast', {}, 'json'),
        page.getFeedEntry('photos'),
      ]
    }

    if (parsed.kind === 'photos') {
      return [
        page.getFeedEntry('photos'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'json'),
        page.getFeedEntry('podcast', {}, 'rss'),
        page.getFeedEntry('podcast', {}, 'json'),
        page.getFeedEntry('archive'),
      ]
    }

    return [
      page.getFeedEntry('posts', {}, 'rss'),
      page.getFeedEntry('posts', {}, 'json'),
      page.getFeedEntry('podcast', {}, 'rss'),
      page.getFeedEntry('podcast', {}, 'json'),
      page.getFeedEntry('archive'),
      page.getFeedEntry('photos'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
