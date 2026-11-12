import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const domains = ['wikidot.com']

const feeds = definePlatformFeeds(
  [
    { key: 'wikidot:site-changes', template: '{scheme}://{host}/feed/site-changes.xml' },
    { key: 'wikidot:forum-threads', template: '{scheme}://{host}/feed/forum/threads.xml' },
    { key: 'wikidot:forum-posts', template: '{scheme}://{host}/feed/forum/posts.xml' },
  ],
  { domains },
)

// A site on its own domain is known only by its marker, so only a feed on a wikidot.com site is
// claimed.
const ownFeeds = definePlatformFeeds(
  [
    { key: 'wikidot:site-changes', template: '{scheme}://{site}.{domain}/feed/site-changes.xml' },
    { key: 'wikidot:forum-threads', template: '{scheme}://{site}.{domain}/feed/forum/threads.xml' },
    { key: 'wikidot:forum-posts', template: '{scheme}://{site}.{domain}/feed/forum/posts.xml' },
  ],
  { domains },
)

export const isWikidotHtml = (content: string): boolean => {
  return content.includes('WIKIDOT.page.listeners.editClick()')
}

export const wikidotHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isWikidotHtml })
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    return [
      page.getFeedEntry('wikidot:site-changes'),
      page.getFeedEntry('wikidot:forum-threads'),
      page.getFeedEntry('wikidot:forum-posts'),
    ]
  },

  getFeedHint: ownFeeds.getFeedHint,
}
