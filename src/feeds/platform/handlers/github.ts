import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// GitHub serves Atom feeds at predictable suffixes — `/{user}.atom`,
// `/{owner}/{repo}/{releases,commits,tags,wiki,discussions}.atom`,
// `/commits/{branch}.atom`, `/commits/{branch}/{file}.atom`, and
// `/discussions/categories/{slug}.atom` — but none of the HTML pages
// advertise them via `<link rel="alternate">` or HTTP Link headers. The
// handler is required to map user, repo, wiki, discussions, tree, blob,
// and commit URLs onto the correct `.atom` endpoints.

const userRegex = /^\/([^/]+)\/?$/
const repoRegex = /^\/([^/]+)\/([^/]+)/
const wikiRegex = /\/wiki(\/|$)/
const discussionsRegex = /\/discussions(\/|$)/
const discussionCategoryRegex = /\/discussions\/categories\/([^/]+)/
const branchRegex = /^\/[^/]+\/[^/]+\/tree\/([^/]+)\/?$/
const fileRegex = /^\/[^/]+\/[^/]+\/(?:blob|commits)\/([^/]+)\/(.+)/

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
    const userMatch = pathname.match(userRegex)

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
    const repoMatch = pathname.match(repoRegex)
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
    if (wikiRegex.test(pathname)) {
      uris.push({
        uri: `https://github.com/${owner}/${repo}/wiki.atom`,
        hint: composeHint('github:wiki'),
      })
    }

    // If on discussions page, add discussions feed.
    if (discussionsRegex.test(pathname)) {
      uris.push({
        uri: `https://github.com/${owner}/${repo}/discussions.atom`,
        hint: composeHint('github:discussions'),
      })
    }

    // If on discussion category page, add category-scoped discussions feed.
    const discussionCategoryMatch = pathname.match(discussionCategoryRegex)

    if (discussionCategoryMatch?.[1]) {
      uris.push({
        uri: `https://github.com/${owner}/${repo}/discussions/categories/${discussionCategoryMatch[1]}.atom`,
        hint: composeHint('github:discussion-category'),
      })
    }

    // If on a specific branch, add branch-specific commits feed.
    const branchMatch = pathname.match(branchRegex)

    if (branchMatch?.[1]) {
      const branch = branchMatch[1]

      uris.push({
        uri: `https://github.com/${owner}/${repo}/commits/${branch}.atom`,
        hint: composeHint('github:branch-commits'),
      })
    }

    // If viewing a file (blob) or file history (commits), add file-specific commits feed.
    const fileMatch = pathname.match(fileRegex)

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
