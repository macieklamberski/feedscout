import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasClass } from '../../common/utils.js'
import { parseSourcehutUrl } from '../../feeds/platforms/sourcehut.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'sourcehut'

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
    return parseSourcehutUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseSourcehutUrl(url)

    if (!parsed) {
      return []
    }

    // A repository page carries no avatar, while its owner's page does.
    if (parsed.kind === 'repo') {
      return [{ platform, id: parsed.owner, url }]
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
