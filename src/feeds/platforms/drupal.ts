import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'
import { isGcsWebHtml } from './gcsWeb.js'

// Discoverability: Discoverable without handler.

const drupalRegex = /drupal/i

export const isDrupalHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Drupal')
}

export const isDrupalHeaders = (headers: Headers): boolean => {
  return drupalRegex.test(headers.get('x-generator') ?? '')
}

export const drupalHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    // GCS-web sites run on Drupal, and the GCS-web handler emits their feeds.
    if (content && isGcsWebHtml(content)) {
      return false
    }

    return hasMarker(content, headers, { html: isDrupalHtml, headers: isDrupalHeaders })
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss.xml`, hint: composeHint('drupal:site') }]
  },
}
