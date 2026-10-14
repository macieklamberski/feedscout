import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BlogiaUrl = { kind: 'blog'; blog: string }

const domains = ['blogia.com']

const excludedSubdomains = ['cms', 'mail']

export const parseBlogiaUrl = (url: string): BlogiaUrl | undefined => {
  const blog = getTenantSubdomain(url, domains, excludedSubdomains)

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

    if (!parsed) {
      return []
    }

    // The blog's alternate link is always https, and http redirects to it.
    return [
      {
        uri: `https://${parsed.blog}.blogia.com/feed.xml`,
        hint: composeHint('blogia:posts'),
      },
    ]
  },
}
