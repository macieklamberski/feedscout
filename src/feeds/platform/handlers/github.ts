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
  'notifications',
  'new',
  'organizations',
  'orgs',
  'codespaces',
  'pulls',
  'issues',
  'apps',
]

export const githubHandler: PlatformHandler = {
  match: (url) => {
    return isAnyOf(new URL(url).hostname, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const uris: Array<string> = []

    // Match /{owner} pattern (user/org profile page).
    const userMatch = pathname.match(/^\/([^/]+)\/?$/)

    if (userMatch?.[1] && !isAnyOf(userMatch[1], excludedPaths)) {
      const user = userMatch[1]

      uris.push(`https://github.com/${user}.atom`)

      return uris
    }

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
    uris.push(`https://github.com/${owner}/${repo}/tags.atom`)

    // If on wiki page, add wiki feed.
    if (pathname.includes('/wiki')) {
      uris.push(`https://github.com/${owner}/${repo}/wiki.atom`)
    }

    // If on discussions page, add discussions feed.
    if (pathname.includes('/discussions')) {
      uris.push(`https://github.com/${owner}/${repo}/discussions.atom`)
    }

    // If on a specific branch, add branch-specific commits feed.
    const branchMatch = pathname.match(/^\/[^/]+\/[^/]+\/tree\/([^/]+)/)

    if (branchMatch?.[1]) {
      const branch = branchMatch[1]

      uris.push(`https://github.com/${owner}/${repo}/commits/${branch}.atom`)
    }

    return uris
  },
}
