import { getAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasElementWithId, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type XenforoUrl =
  | { kind: 'forum'; basePath: string; route: string; forumPath: string }
  | { kind: 'board' }

// XF2 serves a forum at `/f/{slug.id}` or, on the default route, `/forums/{slug.id}`.
const forumPathRegex = /\/(?<route>f|forums)\/(?<forumPath>[^/]+\.\d+)(?:\/|$)/i
// The board feed sits under the same route prefix as the forums. A page outside a
// forum does not carry the prefix, so both spellings are emitted and the one the
// board does not serve fails validation.
const routePrefixes = ['forums', 'f']

// XF2 puts `id="XF"` on the html element and XF1 put `id="XenForo"` there.
const appRootIds = ['XF', 'XenForo']

export const isXenforoHtml = (content: string): boolean => {
  return appRootIds.some((id) => hasElementWithId(content, id))
}

export const parseXenforoUrl = (url: string): XenforoUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const forumMatch = parsedUrl.pathname.match(forumPathRegex)
  const route = getAnyOf(forumMatch?.groups?.route, routePrefixes)
  const forumPath = forumMatch?.groups?.forumPath

  // A board is routinely mounted under a sub-path such as `/community`, in front of the route.
  if (forumMatch && route && forumPath) {
    const basePath = parsedUrl.pathname.slice(0, forumMatch.index)

    return { kind: 'forum', basePath, route, forumPath }
  }

  return { kind: 'board' }
}

export const xenforoHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isXenforoHtml })) {
      return false
    }

    return parseXenforoUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseXenforoUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    if (parsed.kind === 'forum') {
      const routeUrl = `${origin}${parsed.basePath}/${parsed.route}`

      return [
        { uri: `${routeUrl}/${parsed.forumPath}/index.rss`, hint: composeHint('xenforo:forum') },
        { uri: `${routeUrl}/-/index.rss`, hint: composeHint('xenforo:site') },
      ]
    }

    const uris: Array<DiscoverUriEntry> = []

    for (const prefix of routePrefixes) {
      uris.push({ uri: `${origin}/${prefix}/-/index.rss`, hint: composeHint('xenforo:site') })
    }

    return uris
  },
}
