import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type WikidotUrl =
  | { kind: 'thread'; threadId: string }
  | { kind: 'category'; categoryId: string }
  | { kind: 'site' }

const domains = ['wikidot.com']

const threadPathRegex = /^\/forum\/t-(\d+)(?:\/|$)/i
const categoryPathRegex = /^\/forum\/c-(\d+)(?:\/|$)/i

// `{host}` claims only a wikidot.com site, since a site on its own domain is known only by its
// marker. A page comments feed takes the page's internal id, a front forum feed the name its module
// gives it, and a ListPages feed the module's arguments as path segments, any number and in any
// order, so `resolve` builds none of them.
const feeds = definePlatformFeeds(
  [
    { key: 'wikidot:site-changes', template: '{scheme}://{host}/feed/site-changes.xml' },
    { key: 'wikidot:forum-threads', template: '{scheme}://{host}/feed/forum/threads.xml' },
    { key: 'wikidot:forum-posts', template: '{scheme}://{host}/feed/forum/posts.xml' },
    { key: 'wikidot:forum-thread', template: '{scheme}://{host}/feed/forum/t-{threadId}.xml' },
    {
      key: 'wikidot:forum-category-threads',
      template: '{scheme}://{host}/feed/forum/ct-{categoryId}.xml',
    },
    {
      key: 'wikidot:forum-category-posts',
      template: '{scheme}://{host}/feed/forum/cp-{categoryId}.xml',
    },
    {
      key: 'wikidot:page-comments',
      template: '{scheme}://{host}/feed/page/comments-{pageId}.xml',
    },
    { key: 'wikidot:front-forum', template: '{scheme}://{host}/feed/front/{page}/{feed}.xml' },
    { key: 'wikidot:pages', template: '{scheme}://{host}/feed/pages/{arguments*}' },
  ],
  { domains },
)

export const isWikidotHtml = (content: string): boolean => {
  return content.includes('WIKIDOT.page.listeners.editClick()')
}

// A thread page names its thread and a forum category page its category, after any title slug.
export const parseWikidotUrl = (url: string): WikidotUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const threadId = parsedUrl.pathname.match(threadPathRegex)?.[1]

  if (threadId) {
    return { kind: 'thread', threadId }
  }

  const categoryId = parsedUrl.pathname.match(categoryPathRegex)?.[1]

  if (categoryId) {
    return { kind: 'category', categoryId }
  }

  return { kind: 'site' }
}

export const wikidotHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isWikidotHtml })
  },

  resolve: (url) => {
    const parsed = parseWikidotUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'thread') {
      return [
        page.getFeedEntry('wikidot:forum-thread', { threadId: parsed.threadId }),
        page.getFeedEntry('wikidot:site-changes'),
        page.getFeedEntry('wikidot:forum-threads'),
        page.getFeedEntry('wikidot:forum-posts'),
      ]
    }

    if (parsed.kind === 'category') {
      const params = { categoryId: parsed.categoryId }

      return [
        page.getFeedEntry('wikidot:forum-category-threads', params),
        page.getFeedEntry('wikidot:forum-category-posts', params),
        page.getFeedEntry('wikidot:site-changes'),
        page.getFeedEntry('wikidot:forum-threads'),
        page.getFeedEntry('wikidot:forum-posts'),
      ]
    }

    return [
      page.getFeedEntry('wikidot:site-changes'),
      page.getFeedEntry('wikidot:forum-threads'),
      page.getFeedEntry('wikidot:forum-posts'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
