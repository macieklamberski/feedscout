import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf } from '../../../common/utils.js'

const hosts = ['github.com', 'www.github.com']
const excludedPaths = [
  'settings',
  'explore',
  'topics',
  'trending',
  'collections',
  'events',
  'sponsors',
  'about',
  'pricing',
  'search',
  'marketplace',
  'features',
  'enterprise',
  'team',
  'login',
  'signup',
  'join',
]

export const githubHandler: PlatformHandler = {
  match: (url) => {
    return isAnyOf(new URL(url).hostname, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const uris: Array<string> = []

    // Match /{owner}/{repo} pattern.
    const repoMatch = pathname.match(/^\/([^/]+)\/([^/]+)/)
    const owner = repoMatch?.[1]
    const repo = repoMatch?.[2]

    if (!owner || !repo || isAnyOf(owner, excludedPaths)) {
      return []
    }

    // Repository feeds.
    uris.push(`https://github.com/${owner}/${repo}/releases.atom`)
    uris.push(`https://github.com/${owner}/${repo}/commits.atom`)

    // If on a specific branch, add branch-specific commits feed.
    const branchMatch = pathname.match(/^\/[^/]+\/[^/]+\/tree\/([^/]+)/)

    if (branchMatch?.[1]) {
      const branch = branchMatch[1]

      uris.push(`https://github.com/${owner}/${repo}/commits/${branch}.atom`)
    }

    return uris
  },
}
