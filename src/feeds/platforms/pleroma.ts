import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getScriptText, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers profile.

export type PleromaUrl = { kind: 'profile'; username: string }

const apiPath = '/api/pleroma/'

const profileRegex = /^\/users\/([^/]+)/i

// The frontend preloads its config from the API, and older releases inline that response in the
// `initial-results` script, keyed by its path.
export const isPleromaHtml = (content: string): boolean => {
  const preload = findElement(content, (element) => {
    return element.name === 'link' && (element.attribs.href ?? '').startsWith(apiPath)
  })

  if (preload) {
    return true
  }

  return getScriptText(content, 'initial-results')?.includes(`"${apiPath}`) ?? false
}

export const parsePleromaUrl = (url: string): PleromaUrl | undefined => {
  const username = parseUrl(url)?.pathname.match(profileRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const pleromaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isPleromaHtml })) {
      return false
    }

    return parsePleromaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePleromaUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/users/${parsed.username}/feed.atom`,
        hint: composeHint('pleroma:posts', 'atom'),
      },
      {
        uri: `${origin}/users/${parsed.username}/feed.rss`,
        hint: composeHint('pleroma:posts', 'rss'),
      },
    ]
  },
}
