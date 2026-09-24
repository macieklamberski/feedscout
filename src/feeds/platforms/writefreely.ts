import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers singleUserPost, tag (guess, html), partly covers blog, post.

const tagPathRegex = /\/(tag:[^/]+)/
const blogPathRegex = /id="blog-title"[^>]*>\s*<a[^>]*?href="(\/(?:[^"/]+\/)?)"/
const excludedPaths = ['read', 'about', 'login', 'signup', 'me', 'api', 'pad', 'privacy']

const getBlogName = (url: string): string | undefined => {
  const [first] = new URL(url).pathname.split('/').filter(Boolean)

  if (!first || excludedPaths.includes(first.toLowerCase())) {
    return
  }

  return first
}

export const isWritefreelyHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'WriteFreely') ||
    content.includes('href="/css/write.css') ||
    // A Write.as blog on its own domain runs the same routes under the `Write.as` generator.
    hasMetaContent(content, 'generator', 'Write.as')
  )
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

  resolve: (url, content) => {
    try {
      const { origin, pathname } = new URL(url)
      const blogName = getBlogName(url)

      if (!blogName) {
        return []
      }

      // A single-user instance serves its one blog at the root, and the blog title links to it.
      const blogPath = content?.match(blogPathRegex)?.[1] ?? `/${blogName}/`
      const tag = pathname.match(tagPathRegex)?.[1]
      const uris: Array<DiscoverUriEntry> = []

      if (tag) {
        uris.push({
          uri: `${origin}${blogPath}${tag}/feed/`,
          hint: composeHint('writefreely:tag'),
        })
      }

      uris.push({ uri: `${origin}${blogPath}feed/`, hint: composeHint('writefreely:blog') })

      if (blogPath !== '/') {
        uris.push({ uri: `${origin}/read/feed/`, hint: composeHint('writefreely:reader') })
      }

      return uris
    } catch {}

    return []
  },
}
