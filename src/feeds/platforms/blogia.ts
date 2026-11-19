import { blogia } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Unmeasured, bot wall.

export type BlogiaUrl = { kind: 'blog'; blog: string }

const domains = blogia.hosts.tenants

const feeds = withHintLabels(blogia.feeds)

export const parseBlogiaUrl = (url: string): BlogiaUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const blogiaHandler: PlatformHandler = {
  match: (url) => {
    return parseBlogiaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlogiaUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('posts'), page.getFeedEntry('comments')]
  },

  getFeedHint: feeds.getFeedHint,
}
