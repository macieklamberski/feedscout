import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasClass } from '../../common/utils.js'
import { getRepoPath, hosts } from '../../feeds/platforms/sourcehut.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'sourcehut'

const userHosts = ['sr.ht', 'todo.sr.ht', ...hosts]

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
const parseAvatar = (html: string): Array<string> => {
  const avatar = findElement(html, (element) => {
    return element.name === 'img' && hasClass(element, 'avatar') && Boolean(element.attribs.src)
  })
  const src = avatar?.attribs.src

  if (!src) {
    return []
  }

  return [src]
}

export const sourcehutHandler: PlatformHandler = {
  match: (url) => {
    return Boolean(getOwner(url))
  },

  resolve: (url, content) => {
    const owner = getOwner(url)

    if (!owner) {
      return []
    }

    // A repository page carries no avatar, while its owner's page does.
    if (getPathSegments(url).length > 1) {
      return [{ platform, id: owner.slice(1), url }]
    }

    if (!content) {
      return []
    }

    return parseAvatar(content).map((uri) => ({ uri }))
  },
}

export const sourcehutEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const { origin } = new URL(ref.url)
  const response = await context.fetchFn(`${origin}/~${ref.id}/`)

  return parseAvatar(getResponseText(response))
}
