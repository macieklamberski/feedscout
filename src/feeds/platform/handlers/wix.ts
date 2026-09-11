import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// A Wix site with the Blog app installed serves `/blog-feed.xml` at the site
// root, wherever the blog sits in navigation. Home pages link it, so the
// handler earns its place on deep post pages that do not.

export const isWixHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Wix.com')
}

export const wixHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isWixHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      return [{ uri: `${origin}/blog-feed.xml`, hint: composeHint('wix:blog') }]
    } catch {}

    return []
  },
}
