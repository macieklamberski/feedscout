import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type WikidotUrl =
  | { kind: 'thread'; threadId: string }
  | { kind: 'category'; categoryId: string }
  | { kind: 'site' }

const domains = ['wikidot.com']

const threadPathRegex = /^\/forum\/t-(\d+)(?:\/|$)/i
const categoryPathRegex = /^\/forum\/c-(\d+)(?:\/|$)/i
const pagesFeedPathRegex = /^\/feed\/pages\/[^/]/i

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
  ],
  { domains },
)

// A site on its own domain is known only by its marker, so only a feed on a wikidot.com site is
// claimed. A page comments feed takes the page's internal id, and a front forum feed the name its
// module gives it, which only the page content carries.
const ownFeeds = definePlatformFeeds(
  [
    { key: 'wikidot:site-changes', template: '{scheme}://{site}.{domain}/feed/site-changes.xml' },
    { key: 'wikidot:forum-threads', template: '{scheme}://{site}.{domain}/feed/forum/threads.xml' },
    { key: 'wikidot:forum-posts', template: '{scheme}://{site}.{domain}/feed/forum/posts.xml' },
    {
      key: 'wikidot:forum-thread',
      template: '{scheme}://{site}.{domain}/feed/forum/t-{threadId}.xml',
    },
    {
      key: 'wikidot:forum-category-threads',
      template: '{scheme}://{site}.{domain}/feed/forum/ct-{categoryId}.xml',
    },
    {
      key: 'wikidot:forum-category-posts',
      template: '{scheme}://{site}.{domain}/feed/forum/cp-{categoryId}.xml',
    },
    {
      key: 'wikidot:page-comments',
      template: '{scheme}://{site}.{domain}/feed/page/comments-{pageId}.xml',
    },
    {
      key: 'wikidot:front-forum',
      template: '{scheme}://{site}.{domain}/feed/front/{page}/{feed}.xml',
    },
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

    const siteFeeds = [
      page.getFeedEntry('wikidot:site-changes'),
      page.getFeedEntry('wikidot:forum-threads'),
      page.getFeedEntry('wikidot:forum-posts'),
    ]

    if (parsed.kind === 'thread') {
      return [
        page.getFeedEntry('wikidot:forum-thread', { threadId: parsed.threadId }),
        ...siteFeeds,
      ]
    }

    if (parsed.kind === 'category') {
      const params = { categoryId: parsed.categoryId }

      return [
        page.getFeedEntry('wikidot:forum-category-threads', params),
        page.getFeedEntry('wikidot:forum-category-posts', params),
        ...siteFeeds,
      ]
    }

    return siteFeeds
  },

  // A ListPages feed spells the module's arguments as path segments, any number and in any order.
  getFeedHint: (url) => {
    const hint = ownFeeds.getFeedHint(url)

    if (hint) {
      return hint
    }

    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !getTenantSubdomain(parsedUrl, domains)) {
      return
    }

    if (!pagesFeedPathRegex.test(parsedUrl.pathname)) {
      return
    }

    return composeHint('wikidot:pages')
  },
}
