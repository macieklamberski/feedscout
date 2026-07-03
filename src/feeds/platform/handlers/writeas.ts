import { isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Partially discoverable without handler.

const hosts = ['write.as', 'www.write.as']
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
const tagRegex = /^\/([^/]+)\/tag:([^/]+)/

export const writeasHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Tag page: /{user}/tag:{tag}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1] && tagMatch?.[2]) {
      const username = tagMatch[1]
      const tag = tagMatch[2]

      uris.push({
        uri: `https://write.as/${username}/tag:${tag}/feed/`,
        hint: composeHint('writeas:tag'),
      })
      uris.push({
        uri: `https://write.as/${username}/feed/`,
        hint: composeHint('writeas:blog'),
      })

      return uris
    }

    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://write.as/${username}/feed/`,
        hint: composeHint('writeas:blog'),
      },
    ]
  },
}
