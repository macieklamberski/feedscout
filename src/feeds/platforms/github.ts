import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type GithubUrl =
  | { kind: 'user'; owner: string }
  | {
      kind: 'repo'
      owner: string
      repo: string
      section?: 'wiki' | 'discussions'
      discussionCategory?: string
      branch?: string
      file?: { branch: string; path: string }
    }
  | { kind: 'discussions'; org: string; discussionCategory?: string }

const hosts = ['github.com', 'www.github.com']

const wikiRegex = /^\/[^/]+\/[^/]+\/wiki(?:\/|$)/i
const discussionsRegex = /^\/[^/]+\/[^/]+\/discussions(?:\/|$)/i
const discussionCategoryRegex = /^\/[^/]+\/[^/]+\/discussions\/categories\/([^/]+)/i
const branchRegex = /^\/[^/]+\/[^/]+\/(?:tree|commits)\/([^/]+)\/?$/i
const fileRegex = /^\/[^/]+\/[^/]+\/(?:blob|commits)\/([^/]+)\/([^/].*?)\/*$/i
// suffixes: GitHub's own user routes, a name with .atom, .gpg, .keys or .png
const userRouteSuffixRegex = /\.(?:atom|gpg|keys|png)$/i

const feeds = definePlatformFeeds([
  { key: 'github:activity', template: 'https://github.com/{owner}.atom' },
  { key: 'github:releases', template: 'https://github.com/{owner}/{repo}/releases.atom' },
  { key: 'github:commits', template: 'https://github.com/{owner}/{repo}/commits.atom' },
  { key: 'github:tags', template: 'https://github.com/{owner}/{repo}/tags.atom' },
  { key: 'github:wiki', template: 'https://github.com/{owner}/{repo}/wiki.atom' },
  { key: 'github:discussions', template: 'https://github.com/{owner}/{repo}/discussions.atom' },
  { key: 'github:discussions', template: 'https://github.com/orgs/{org}/discussions.atom' },
  {
    key: 'github:discussion-category',
    template: 'https://github.com/{owner}/{repo}/discussions/categories/{category}.atom',
  },
  {
    key: 'github:discussion-category',
    template: 'https://github.com/orgs/{org}/discussions/categories/{category}.atom',
  },
  {
    key: 'github:branch-commits',
    template: 'https://github.com/{owner}/{repo}/commits/{branch}.atom',
  },
  {
    key: 'github:file-history',
    template: 'https://github.com/{owner}/{repo}/commits/{branch}/{path*}.atom',
  },
])

const getRepoSection = (pathname: string): 'wiki' | 'discussions' | undefined => {
  if (wikiRegex.test(pathname)) {
    return 'wiki'
  }

  if (discussionsRegex.test(pathname)) {
    return 'discussions'
  }
}

export const parseGithubUrl = (url: string): GithubUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const { pathname } = new URL(url)
  const [routeOrOwner, orgOrRepo, orgRoute] = getPathSegments(url)
  const discussionCategory = pathname.match(discussionCategoryRegex)?.[1]

  if (isAnyOf(routeOrOwner, 'orgs') && orgOrRepo && isAnyOf(orgRoute, 'discussions')) {
    return { kind: 'discussions', org: orgOrRepo, discussionCategory }
  }

  // An organization page sits under /orgs/, and its feed is the owner feed.
  if (isAnyOf(routeOrOwner, 'orgs') && orgOrRepo) {
    return { kind: 'user', owner: orgOrRepo }
  }

  const owner = orgOrRepo ? routeOrOwner : routeOrOwner?.replace(userRouteSuffixRegex, '')

  // GitHub names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (!owner || owner.includes('.')) {
    return
  }

  if (orgOrRepo) {
    const fileMatch = pathname.match(fileRegex)

    return {
      kind: 'repo',
      owner,
      repo: orgOrRepo,
      section: getRepoSection(pathname),
      discussionCategory,
      branch: pathname.match(branchRegex)?.[1],
      file: fileMatch ? { branch: fileMatch[1], path: fileMatch[2] } : undefined,
    }
  }

  return { kind: 'user', owner }
}

export const githubHandler: PlatformHandler = {
  match: (url) => {
    return parseGithubUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGithubUrl(url)

    if (!parsed) {
      return []
    }

    // User or organization profile page: /{owner}.
    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('github:activity', { owner: parsed.owner })]
    }

    // Organization discussions page: /orgs/{org}/discussions.
    if (parsed.kind === 'discussions') {
      const { org, discussionCategory } = parsed

      if (discussionCategory) {
        return [
          feeds.getFeedEntry('github:discussions', { org }),
          feeds.getFeedEntry('github:discussion-category', { org, category: discussionCategory }),
        ]
      }

      return [feeds.getFeedEntry('github:discussions', { org })]
    }

    const { owner, repo, section, discussionCategory, branch, file } = parsed
    const params = { owner, repo }

    if (section === 'wiki') {
      return [
        feeds.getFeedEntry('github:releases', params),
        feeds.getFeedEntry('github:commits', params),
        feeds.getFeedEntry('github:tags', params),
        feeds.getFeedEntry('github:wiki', params),
      ]
    }

    if (section === 'discussions' && discussionCategory) {
      return [
        feeds.getFeedEntry('github:releases', params),
        feeds.getFeedEntry('github:commits', params),
        feeds.getFeedEntry('github:tags', params),
        feeds.getFeedEntry('github:discussions', params),
        feeds.getFeedEntry('github:discussion-category', {
          ...params,
          category: discussionCategory,
        }),
      ]
    }

    if (section === 'discussions') {
      return [
        feeds.getFeedEntry('github:releases', params),
        feeds.getFeedEntry('github:commits', params),
        feeds.getFeedEntry('github:tags', params),
        feeds.getFeedEntry('github:discussions', params),
      ]
    }

    if (branch) {
      return [
        feeds.getFeedEntry('github:releases', params),
        feeds.getFeedEntry('github:commits', params),
        feeds.getFeedEntry('github:tags', params),
        feeds.getFeedEntry('github:branch-commits', { ...params, branch }),
      ]
    }

    if (file) {
      return [
        feeds.getFeedEntry('github:releases', params),
        feeds.getFeedEntry('github:commits', params),
        feeds.getFeedEntry('github:tags', params),
        feeds.getFeedEntry('github:file-history', {
          ...params,
          branch: file.branch,
          path: file.path,
        }),
      ]
    }

    return [
      feeds.getFeedEntry('github:releases', params),
      feeds.getFeedEntry('github:commits', params),
      feeds.getFeedEntry('github:tags', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
