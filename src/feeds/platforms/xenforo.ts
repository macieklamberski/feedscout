import { getAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasElementWithId, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type XenforoUrl = { kind: 'forum'; route: string; forumPath: string } | { kind: 'board' }

// XF2 serves a forum at `/f/{slug.id}` or, on the default route, `/forums/{slug.id}`.
const forumPathRegex = /\/(f|forums)\/([^/]+\.\d+)(?:\/|$)/i
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

  const [, rawRoute, forumPath] = parsedUrl.pathname.match(forumPathRegex) ?? []
  const route = getAnyOf(rawRoute, routePrefixes)

  if (route && forumPath) {
    return { kind: 'forum', route, forumPath }
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
      return [
        {
          uri: `${origin}/${parsed.route}/${parsed.forumPath}/index.rss`,
          hint: composeHint('xenforo:forum'),
        },
        { uri: `${origin}/${parsed.route}/-/index.rss`, hint: composeHint('xenforo:site') },
      ]
    }

    const uris: Array<DiscoverUriEntry> = []

    for (const prefix of routePrefixes) {
      uris.push({ uri: `${origin}/${prefix}/-/index.rss`, hint: composeHint('xenforo:site') })
    }

    return uris
  },
}
