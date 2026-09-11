import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// A Svbtle blog serves Atom at `/feed` on its own host.
//
// `www.svbtle.com/feed` is not a feed: it answers 200 with an HTML discovery
// page, and the path form `svbtle.com/{user}/feed` does not exist either, so
// the platform's own host is excluded.

const excludedHosts = ['svbtle.com', 'www.svbtle.com']

export const isSvbtleHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Svbtle.com')
}

export const svbtleHandler: PlatformHandler = {
  match: (url, content) => {
    if (!URL.canParse(url) || isHostOf(url, excludedHosts)) {
      return false
    }

    return Boolean(content) && isSvbtleHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      if (isHostOf(url, excludedHosts)) {
        return []
      }

      return [{ uri: `${origin}/feed`, hint: composeHint('svbtle:posts') }]
    } catch {}

    return []
  },
}
