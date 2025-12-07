import { isAnyOf } from '../../../common/utils.js'
import type { PlatformHandler } from '../types.js'

const hosts = ['github.com', 'www.github.com']

export const githubHandler: PlatformHandler = {
  match: (url) => isAnyOf(new URL(url).hostname, hosts),

  resolve: async (url) => {
    const { pathname } = new URL(url)
    const uris: Array<string> = []

    // Match /{owner}/{repo} pattern.
    const repoMatch = pathname.match(/^\/([^/]+)\/([^/]+)/)

    if (!repoMatch?.[1] || !repoMatch?.[2]) {
      return []
    }

    const owner = repoMatch[1]
    const repo = repoMatch[2]

    // Skip special paths that aren't repositories.
    const specialPaths = [
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

    if (specialPaths.includes(owner.toLowerCase())) {
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
