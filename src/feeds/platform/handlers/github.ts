import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'

const hosts = ['github.com', 'www.github.com']
const excludedPaths = [
  'about',
  'account',
  'apps',
  'blog',
  'careers',
  'codespaces',
  'collections',
  'contact',
  'copilot',
  'customer-stories',
  'dashboard',
  'education',
  'enterprise',
  'events',
  'explore',
  'features',
  'feed',
  'home',
  'issues',
  'join',
  'login',
  'marketplace',
  'new',
  'nonprofit',
  'notifications',
  'organizations',
  'orgs',
  'password_reset',
  'premium-support',
  'pricing',
  'pulls',
  'readme',
  'resources',
  'search',
  'security',
  'sessions',
  'settings',
  'site',
  'sponsors',
  'stars',
  'team',
  'topics',
  'trending',
  'watching',
]

export const githubHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
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
    if (/\/wiki(\/|$)/.test(pathname)) {
      uris.push(`https://github.com/${owner}/${repo}/wiki.atom`)
    }

    // If on discussions page, add discussions feed.
    if (/\/discussions(\/|$)/.test(pathname)) {
      uris.push(`https://github.com/${owner}/${repo}/discussions.atom`)
    }

    // If on a specific branch, add branch-specific commits feed.
    const branchMatch = pathname.match(/^\/[^/]+\/[^/]+\/tree\/([^/]+)\/?$/)

    if (branchMatch?.[1]) {
      const branch = branchMatch[1]

      uris.push(`https://github.com/${owner}/${repo}/commits/${branch}.atom`)
    }

    // If viewing a file (blob) or file history (commits), add file-specific commits feed.
    const fileMatch = pathname.match(/^\/[^/]+\/[^/]+\/(?:blob|commits)\/([^/]+)\/(.+)/)

    if (fileMatch?.[1] && fileMatch?.[2]) {
      const branch = fileMatch[1]
      const filePath = fileMatch[2]

      uris.push(`https://github.com/${owner}/${repo}/commits/${branch}/${filePath}.atom`)
    }

    return uris
  },
}
