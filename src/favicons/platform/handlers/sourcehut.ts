import { getPathSegments, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getRepoPath, hosts } from '../../../feeds/platform/handlers/sourcehut.js'

const userHosts = ['sr.ht', 'todo.sr.ht', ...hosts]

const avatarRegex = /<img(?=[^>]*\sclass=["'](?:[^"']*\s)?avatar[\s"'])[^>]*\ssrc=["']([^"']+)["']/i

const getOwner = (url: string): string | undefined => {
  const segments = getPathSegments(url)
  const owner = segments[0]

  if (!owner?.startsWith('~') || owner.length < 2) {
    return
  }

  if (segments.length === 1 && isHostOf(url, userHosts)) {
    return owner
  }

  if (isHostOf(url, hosts) && getRepoPath(url)) {
    return owner
  }
}

// A user without an avatar gets no `img.avatar` on the page.
const parseAvatar = (html: string): Array<DiscoverUriEntry> => {
  const src = html.match(avatarRegex)?.[1]

  if (!src) {
    return []
  }

  return [{ uri: src }]
}

export const sourcehutHandler: PlatformHandler = {
  match: (url) => {
    return Boolean(getOwner(url))
  },

  resolve: async (url, content, _headers, fetchFn) => {
    const owner = getOwner(url)

    if (!owner) {
      return []
    }

    // A user page carries its own avatar, while a repository page needs its owner's page.
    if (getPathSegments(url).length === 1) {
      return content ? parseAvatar(content) : []
    }

    if (!fetchFn) {
      return []
    }

    try {
      const { origin } = new URL(url)
      const response = await fetchFn(`${origin}/${owner}/`)

      if (typeof response.body === 'string') {
        return parseAvatar(response.body)
      }
    } catch {}

    return []
  },
}
