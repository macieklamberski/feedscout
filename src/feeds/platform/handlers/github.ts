import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

const userPattern = /^\/([^/]+)\/?$/
const repoPattern = /^\/([^/]+)\/([^/]+)/
const wikiPattern = /\/wiki(\/|$)/
const discussionsPattern = /\/discussions(\/|$)/
const branchPattern = /^\/[^/]+\/[^/]+\/tree\/([^/]+)\/?$/
const filePattern = /^\/[^/]+\/[^/]+\/(?:blob|commits)\/([^/]+)\/(.+)/

export const hosts = ['github.com', 'www.github.com']
export const excludedPaths = [
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
  'signup',
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
    const uris: Array<DiscoverUriEntry> = []

    // Match /{owner} pattern (user/org profile page).
    const userMatch = pathname.match(userPattern)

    if (userMatch?.[1] && !isAnyOf(userMatch[1], excludedPaths)) {
      const user = userMatch[1]

      return [
        {
          uri: `https://github.com/${user}.atom`,
          hint: composeHint('github:activity'),
        },
      ]
    }

    // Match /{owner}/{repo} pattern.
    const repoMatch = pathname.match(repoPattern)
    const owner = repoMatch?.[1]
    const repo = repoMatch?.[2]

    if (!owner || !repo || isAnyOf(owner, excludedPaths)) {
      return []
    }

    // Repository feeds.
    uris.push({
      uri: `https://github.com/${owner}/${repo}/releases.atom`,
      hint: composeHint('github:releases'),
    })
    uris.push({
      uri: `https://github.com/${owner}/${repo}/commits.atom`,
      hint: composeHint('github:commits'),
    })
    uris.push({
      uri: `https://github.com/${owner}/${repo}/tags.atom`,
      hint: composeHint('github:tags'),
    })

    // If on wiki page, add wiki feed.
    if (wikiPattern.test(pathname)) {
      uris.push({
        uri: `https://github.com/${owner}/${repo}/wiki.atom`,
        hint: composeHint('github:wiki'),
      })
    }

    // If on discussions page, add discussions feed.
    if (discussionsPattern.test(pathname)) {
      uris.push({
        uri: `https://github.com/${owner}/${repo}/discussions.atom`,
        hint: composeHint('github:discussions'),
      })
    }

    // If on a specific branch, add branch-specific commits feed.
    const branchMatch = pathname.match(branchPattern)

    if (branchMatch?.[1]) {
      const branch = branchMatch[1]

      uris.push({
        uri: `https://github.com/${owner}/${repo}/commits/${branch}.atom`,
        hint: composeHint('github:branch-commits'),
      })
    }

    // If viewing a file (blob) or file history (commits), add file-specific commits feed.
    const fileMatch = pathname.match(filePattern)

    if (fileMatch?.[1] && fileMatch?.[2]) {
      const branch = fileMatch[1]
      const filePath = fileMatch[2]

      uris.push({
        uri: `https://github.com/${owner}/${repo}/commits/${branch}/${filePath}.atom`,
        hint: composeHint('github:file-history'),
      })
    }

    return uris
  },
}
