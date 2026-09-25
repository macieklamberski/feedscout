import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type GithubUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'repo'; owner: string; repo: string }

const hosts = ['github.com', 'www.github.com']

const wikiRegex = /\/wiki(\/|$)/i
const discussionsRegex = /\/discussions(\/|$)/i
const discussionCategoryRegex = /\/discussions\/categories\/([^/]+)/i
const branchRegex = /^\/[^/]+\/[^/]+\/tree\/([^/]+)\/?$/i
const fileRegex = /^\/[^/]+\/[^/]+\/(?:blob|commits)\/([^/]+)\/(.+)/i

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
  'signup',
  'site',
  'sponsors',
  'stars',
  'team',
  'topics',
  'trending',
  'watching',
]

export const parseGithubUrl = (url: string): GithubUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [first, repo] = getPathSegments(url)
  // GitHub names carry no dots, so a dot starts a route suffix such as .atom or .png.
  const owner = first?.split('.')[0]

  if (!owner || isAnyOf(owner, excludedPaths)) {
    return
  }

  if (repo) {
    return { kind: 'repo', owner, repo }
  }

  return { kind: 'user', owner }
}

export const githubHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const parsed = parseGithubUrl(url)

    // User or organization profile page: /{owner}.
    if (parsed?.kind === 'user') {
      return [
        {
          uri: `https://github.com/${parsed.owner}.atom`,
          hint: composeHint('github:activity'),
        },
      ]
    }

    if (parsed?.kind !== 'repo') {
      return []
    }

    const { owner, repo } = parsed
    const uris: Array<DiscoverUriEntry> = []

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
