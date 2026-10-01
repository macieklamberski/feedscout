import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WriteasUrl =
  | { kind: 'tag'; username: string; tag: string }
  | { kind: 'blog'; username: string }

const hosts = ['write.as', 'www.write.as']

const tagRegex = /^\/([^/]+)\/tag:([^/]+)/i

const excludedPaths = [
  'about',
  'api',
  'blog',
  'docs',
  'legal',
  'login',
  'me',
  'pricing',
  'privacy',
  'settings',
  'signup',
  'terms',
]

export const parseWriteasUrl = (url: string): WriteasUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  // Tag page: /{user}/tag:{tag}
  const tagMatch = parsedUrl.pathname.match(tagRegex)

  if (tagMatch?.[1] && tagMatch[2]) {
    return { kind: 'tag', username: tagMatch[1], tag: tagMatch[2] }
  }

  const [username] = getPathSegments(parsedUrl)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'blog', username }
}

export const writeasHandler: PlatformHandler = {
  match: (url) => {
    return parseWriteasUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseWriteasUrl(url)

    if (!parsed) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'tag') {
      uris.push({
        uri: `https://write.as/${parsed.username}/tag:${parsed.tag}/feed/`,
        hint: composeHint('writeas:tag'),
      })
    }

    uris.push({
      uri: `https://write.as/${parsed.username}/feed/`,
      hint: composeHint('writeas:blog'),
    })

    return uris
  },
}
