import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformFeedParams } from '../../common/uris/platform/feeds.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

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
const fileRegex = /^\/[^/]+\/[^/]+\/(?:blob|commits)\/([^/]+)\/(.+)/i
const userRouteSuffixRegex = /\.(?:atom|gpg|keys|png)$/i
const fileHistoryFeedRegex = /^\/[^/]+\/[^/]+\/commits\/[^/]+\/.+\.atom\/?$/i

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
])

const getDiscussionFeeds = (
  params: PlatformFeedParams,
  category?: string,
): Array<DiscoverUriEntry> => {
  const uris = [feeds.getFeedEntry('github:discussions', params)]

  if (category) {
    uris.push(feeds.getFeedEntry('github:discussion-category', { ...params, category }))
  }

  return uris
}

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
      return getDiscussionFeeds({ org: parsed.org }, parsed.discussionCategory)
    }

    const { owner, repo, section, discussionCategory, branch, file } = parsed
    const uris = [
      feeds.getFeedEntry('github:releases', { owner, repo }),
      feeds.getFeedEntry('github:commits', { owner, repo }),
      feeds.getFeedEntry('github:tags', { owner, repo }),
    ]

    if (section === 'wiki') {
      uris.push(feeds.getFeedEntry('github:wiki', { owner, repo }))
    }

    if (section === 'discussions') {
      uris.push(...getDiscussionFeeds({ owner, repo }, discussionCategory))
    }

    if (branch) {
      uris.push(feeds.getFeedEntry('github:branch-commits', { owner, repo, branch }))
    }

    // The file path keeps its slashes, so it is written outside the table.
    if (file) {
      uris.push({
        uri: `https://github.com/${owner}/${repo}/commits/${file.branch}/${file.path}.atom`,
        hint: composeHint('github:file-history'),
      })
    }

    return uris
  },

  getFeedKey: (url) => {
    const key = feeds.getFeedKey(url)

    if (key) {
      return key
    }

    const parsedUrl = parseUrl(url)

    // A file history feed carries a file path of any depth, which a template segment cannot hold.
    if (parsedUrl && isHostOf(parsedUrl, hosts) && fileHistoryFeedRegex.test(parsedUrl.pathname)) {
      return 'github:file-history'
    }
  },
}
