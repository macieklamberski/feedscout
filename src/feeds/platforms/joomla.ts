import { composeQuery, getQueryParam, parseUrl } from 'trousse'
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

// A site without search-engine friendly URLs names the view in the query, as in
// `index.php?option=com_content&view=category&id=8`.
const routingParams = ['option', 'view', 'layout', 'id', 'catid', 'Itemid', 'lang']

const getFeedQuery = (searchParams: URLSearchParams, type: string): string => {
  const query: Record<string, string> = {}

  for (const name of routingParams) {
    const value = getQueryParam(searchParams, name)

    if (getQueryParam(searchParams, 'option') !== undefined && value) {
      query[name] = value
    }
  }

  query.format = 'feed'
  query.type = type

  return composeQuery(query)
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

    const { origin, searchParams } = new URL(url)
    const viewUrl = `${origin}${parsed.path}`

    return [
      {
        uri: `${viewUrl}${getFeedQuery(searchParams, 'rss')}`,
        hint: composeHint('joomla:view', 'rss'),
      },
      {
        uri: `${viewUrl}${getFeedQuery(searchParams, 'atom')}`,
        hint: composeHint('joomla:view', 'atom'),
      },
    ]
  },
}
