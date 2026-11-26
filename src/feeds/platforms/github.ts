import { github } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: activity, branch-commits, commits, discussion-category, discussions, file-history, releases, tags, wiki.

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

const hosts = github.hosts.exact

const wikiRegex = /^\/[^/]+\/[^/]+\/wiki(?:\/|$)/i
const discussionsRegex = /^\/[^/]+\/[^/]+\/discussions(?:\/|$)/i
const discussionCategoryRegex = /^\/[^/]+\/[^/]+\/discussions\/categories\/([^/]+)/i
const branchRegex = /^\/[^/]+\/[^/]+\/(?:tree|commits)\/([^/]+)\/?$/i
const fileRegex = /^\/[^/]+\/[^/]+\/(?:blob|commits)\/([^/]+)\/([^/].*?)\/*$/i
// suffixes: GitHub's own user routes, a name with .atom, .gpg, .keys or .png
const userRouteSuffixRegex = /\.(?:atom|gpg|keys|png)$/i

const feeds = withHintLabels(github.feeds)

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

  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
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
      return [feeds.getFeedEntry('activity', { owner: parsed.owner })]
    }

    // Organization discussions page: /orgs/{org}/discussions.
    if (parsed.kind === 'discussions') {
      const { org, discussionCategory } = parsed

      if (discussionCategory) {
        return [
          feeds.getFeedEntry('discussions', { org }),
          feeds.getFeedEntry('discussion-category', { org, category: discussionCategory }),
        ]
      }

      return [feeds.getFeedEntry('discussions', { org })]
    }

    const { owner, repo, section, discussionCategory, branch, file } = parsed
    const params = { owner, repo }

    if (section === 'wiki') {
      return [
        feeds.getFeedEntry('releases', params),
        feeds.getFeedEntry('commits', params),
        feeds.getFeedEntry('tags', params),
        feeds.getFeedEntry('wiki', params),
      ]
    }

    if (section === 'discussions' && discussionCategory) {
      return [
        feeds.getFeedEntry('releases', params),
        feeds.getFeedEntry('commits', params),
        feeds.getFeedEntry('tags', params),
        feeds.getFeedEntry('discussions', params),
        feeds.getFeedEntry('discussion-category', {
          ...params,
          category: discussionCategory,
        }),
      ]
    }

    if (section === 'discussions') {
      return [
        feeds.getFeedEntry('releases', params),
        feeds.getFeedEntry('commits', params),
        feeds.getFeedEntry('tags', params),
        feeds.getFeedEntry('discussions', params),
      ]
    }

    if (branch) {
      return [
        feeds.getFeedEntry('releases', params),
        feeds.getFeedEntry('commits', params),
        feeds.getFeedEntry('tags', params),
        feeds.getFeedEntry('branch-commits', { ...params, branch }),
      ]
    }

    if (file) {
      return [
        feeds.getFeedEntry('releases', params),
        feeds.getFeedEntry('commits', params),
        feeds.getFeedEntry('tags', params),
        feeds.getFeedEntry('file-history', {
          ...params,
          branch: file.branch,
          path: file.path,
        }),
      ]
    }

    return [
      feeds.getFeedEntry('releases', params),
      feeds.getFeedEntry('commits', params),
      feeds.getFeedEntry('tags', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
