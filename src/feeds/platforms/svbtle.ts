import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// `www.svbtle.com/feed` answers 200 with an HTML page, and `svbtle.com/{user}/feed` does not exist.
const excludedHosts = ['svbtle.com', 'www.svbtle.com']

export const isSvbtleHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'Svbtle.com') ||
    content.includes('https://lightning.svbtle.com/cargo/')
  )
}

export const svbtleHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isHostOf(url, excludedHosts)) {
      return false
    }

    return hasMarker(content, headers, { html: isSvbtleHtml })
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    if (isHostOf(url, excludedHosts)) {
      return []
    }

    return [{ uri: `${origin}/feed`, hint: composeHint('svbtle:posts') }]
  },
}
