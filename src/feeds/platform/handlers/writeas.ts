import { isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Write.as blogs expose `/{user}/feed/` and `/{user}/tag:{tag}/feed/` (RSS 2.0)
// on the shared `write.as` host, but blog pages emit no
// `<link rel="alternate" type="application/rss+xml">` autodiscovery tag. The
// handler extracts the username (or username + tag) from the path, skipping
// reserved top-level segments (`about`, `pricing`, `login`, …) that would
// otherwise be misread as blog handles.

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
