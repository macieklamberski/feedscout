import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// A HubSpot blog serves RSS at `{blog-path}/rss.xml`. The feed hangs off the
// blog path, never the host root, which answers 404.
//
// A site can serve the same blog at two paths, so the path a page advertises
// and the path derived from the URL are not always the same feed URL.

const getBlogPath = (url: string): string | undefined => {
  const [first] = new URL(url).pathname.split('/').filter(Boolean)

  return first
}

export const isHubspotHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'HubSpot')
}

export const hubspotHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isHubspotHtml(content)) {
        return false
      }

      return Boolean(getBlogPath(url))
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)
      const blogPath = getBlogPath(url)

      if (!blogPath) {
        return []
      }

      return [{ uri: `${origin}/${blogPath}/rss.xml`, hint: composeHint('hubspot:blog') }]
    } catch {}

    return []
  },
}
