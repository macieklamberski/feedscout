import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JoomlaUrl = { kind: 'view'; path: string }

// Templates such as Helix Ultimate rewrite the generator to a string that only
// contains `Joomla!`, while every Joomla 3, 4 and 5 page ships the script options.
export const isJoomlaHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'Joomla!') || content.includes('joomla-script-options')
  )
}

export const parseJoomlaUrl = (url: string): JoomlaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  return { kind: 'view', path: parsedUrl.pathname }
}

export const joomlaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isJoomlaHtml })) {
      return false
    }

    return parseJoomlaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseJoomlaUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const viewUrl = `${origin}${parsed.path}`

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
  },
}
