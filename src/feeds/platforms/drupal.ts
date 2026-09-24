import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const drupalRegex = /drupal/i

export const isDrupalHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Drupal')
}

export const isDrupalHeaders = (headers: Headers): boolean => {
  return drupalRegex.test(headers.get('x-generator') ?? '')
}

export const drupalHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!parseUrl(url)) {
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
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin } = parsedUrl

    return [{ uri: `${origin}/rss.xml`, hint: composeHint('drupal:site') }]
  },
}
