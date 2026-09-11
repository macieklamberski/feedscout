import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// A WriteFreely blog serves RSS at `{instance}/{user}/feed/` and the instance
// reader at `{instance}/read/feed/`. The trailing slash is required and
// `{instance}/feed/` answers 404.
//
// The generator meta appears on blog pages and is often missing from the
// instance root.

const excludedPaths = ['read', 'about', 'login', 'signup', 'me', 'api', 'pad', 'privacy']

const getBlogName = (url: string): string | undefined => {
  const [first] = new URL(url).pathname.split('/').filter(Boolean)

  if (!first || excludedPaths.includes(first.toLowerCase())) {
    return
  }

  return first
}

export const isWritefreelyHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'WriteFreely')
}

export const writefreelyHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isWritefreelyHtml(content)) {
        return false
      }

      return Boolean(getBlogName(url))
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)
      const blogName = getBlogName(url)

      if (!blogName) {
        return []
      }

      return [
        { uri: `${origin}/${blogName}/feed/`, hint: composeHint('writefreely:blog') },
        { uri: `${origin}/read/feed/`, hint: composeHint('writefreely:reader') },
      ]
    } catch {}

    return []
  },
}
