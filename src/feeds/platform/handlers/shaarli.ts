import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Shaarli serves its feeds at `/feed/rss` and `/feed/atom` since 0.12. Older
// installs answer 404 there and serve `?do=rss` instead, so both shapes are
// emitted and discovery drops whichever is dead.

export const isShaarliHtml = (content: string): boolean => {
  return content.includes('id="shaarli-menu"')
}

export const shaarliHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isShaarliHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      return [
        { uri: `${origin}/feed/rss`, hint: composeHint('shaarli:posts-rss') },
        { uri: `${origin}/feed/atom`, hint: composeHint('shaarli:posts-atom') },
        { uri: `${origin}/?do=rss`, hint: composeHint('shaarli:posts-legacy') },
      ]
    } catch {}

    return []
  },
}
