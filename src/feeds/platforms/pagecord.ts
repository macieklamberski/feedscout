import { getQueryParam, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PagecordUrl = { kind: 'blog' } | { kind: 'tag'; tag: string }

const domains = ['pagecord.com']

const feeds = definePlatformFeeds(
  [
    { key: 'pagecord:blog', template: '{scheme}://{host}/feed.xml' },
    { key: 'pagecord:blog', template: '{scheme}://{host}/feed', isAlias: true },
    { key: 'pagecord:blog', template: '{scheme}://{host}/feed.rss', isAlias: true },
    { key: 'pagecord:tag', template: '{scheme}://{host}/feed.xml?tag={tag}' },
    { key: 'pagecord:tag', template: '{scheme}://{host}/feed?tag={tag}', isAlias: true },
    { key: 'pagecord:tag', template: '{scheme}://{host}/feed.rss?tag={tag}', isAlias: true },
  ],
  { domains },
)

export const parsePagecordUrl = (url: string): PagecordUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !getTenantSubdomain(parsedUrl, domains)) {
    return
  }

  // A page filtered by `?tag=` links the feed under the same filter.
  const tag = getQueryParam(parsedUrl.searchParams, 'tag')

  if (tag) {
    return { kind: 'tag', tag }
  }

  return { kind: 'blog' }
}

export const pagecordHandler: PlatformHandler = {
  match: (url) => {
    return parsePagecordUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePagecordUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [
        page.getFeedEntry('pagecord:tag', { tag: parsed.tag }),
        page.getFeedEntry('pagecord:blog'),
      ]
    }

    return [page.getFeedEntry('pagecord:blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
