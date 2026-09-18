import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Drupal serves a site-wide feed at `/rss.xml`. Many sites carry no
// `alternate` link for it, and the guess method finds the path anyway, so the
// handler exists to resolve it without a page fetch.
//
// The `X-Generator` header and the meta tag are Drupal 8 and later. Drupal 7
// often serves `/rss.xml` with neither, and drupal.org itself strips both.

const drupalRegex = /drupal/i

export const isDrupalHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Drupal')
}

export const isDrupalHeaders = (headers: Headers): boolean => {
  return drupalRegex.test(headers.get('x-generator') ?? '')
}

export const drupalHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!URL.canParse(url)) {
      return false
    }

    if (content && isDrupalHtml(content)) {
      return true
    }

    if (headers && isDrupalHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      return [{ uri: `${origin}/rss.xml`, hint: composeHint('drupal:site') }]
    } catch {}

    return []
  },
}
