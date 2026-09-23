import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { hosts } from '../../../feeds/platform/handlers/sourcehut.js'

const userHosts = ['sr.ht', 'todo.sr.ht', ...hosts]

const avatarRegex = /<img(?=[^>]*\sclass=["'](?:[^"']*\s)?avatar[\s"'])[^>]*\ssrc=["']([^"']+)["']/i

const isUserPage = (url: string): boolean => {
  const segments = getPathSegments(url)
  const owner = segments[0]

  if (segments.length !== 1 || !owner?.startsWith('~') || owner.length < 2) {
    return false
  }

  return isHostOf(url, userHosts)
}

export const sourcehutHandler: PlatformHandler = {
  match: (url) => {
    return isUserPage(url)
  },

  resolve: (url, content) => {
    if (!content || !isUserPage(url)) {
      return []
    }

    // A user without an avatar gets no `img.avatar` on the page.
    const src = content.match(avatarRegex)?.[1]

    if (!src) {
      return []
    }

    return [{ uri: src }]
  },
}
