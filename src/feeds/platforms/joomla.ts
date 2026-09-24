import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Templates such as Helix Ultimate rewrite the generator to a string that only
// contains `Joomla!`, while every Joomla 3, 4 and 5 page ships the script options.
export const isJoomlaHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'Joomla!') || content.includes('joomla-script-options')
  )
}

export const joomlaHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isJoomlaHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const viewUrl = `${origin}${pathname}`

      return [
        {
          uri: `${viewUrl}?format=feed&type=rss`,
          hint: composeHint('joomla:view', 'rss'),
        },
        {
          uri: `${viewUrl}?format=feed&type=atom`,
          hint: composeHint('joomla:view', 'atom'),
        },
      ]
    } catch {}

    return []
  },
}
