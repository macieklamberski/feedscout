import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasElementWithId } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// XF2 serves a forum at `/f/{slug.id}` or, on the default route, `/forums/{slug.id}`.
const forumPathRegex = /\/(f|forums)\/([^/]+\.\d+)/
// The board feed sits under the same route prefix as the forums. A page outside a
// forum does not carry the prefix, so both spellings are emitted and the one the
// board does not serve fails validation.
const routePrefixes = ['forums', 'f']

// XF2 puts `id="XF"` on the html element and XF1 put `id="XenForo"` there.
const appRootIds = ['XF', 'XenForo']

export const isXenforoHtml = (content: string): boolean => {
  return appRootIds.some((id) => hasElementWithId(content, id))
}

export const xenforoHandler: PlatformHandler = {
  match: (url, content) => {
    return Boolean(parseUrl(url)) && Boolean(content) && isXenforoHtml(content ?? '')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const [, route, forumPath] = pathname.match(forumPathRegex) ?? []
    const uris: Array<DiscoverUriEntry> = []

    if (route && forumPath) {
      uris.push({
        uri: `${origin}/${route}/${forumPath}/index.rss`,
        hint: composeHint('xenforo:forum'),
      })
    }

    for (const prefix of route ? [route] : routePrefixes) {
      uris.push({ uri: `${origin}/${prefix}/-/index.rss`, hint: composeHint('xenforo:site') })
    }

    return uris
  },
}
