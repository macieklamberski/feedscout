import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
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

// Repository and organization discussions sit at the same path depth:
// /{owner}/{repo}/discussions and /orgs/{org}/discussions.
const getDiscussionFeeds = (base: string, category?: string): Array<DiscoverUriEntry> => {
  const uris: Array<DiscoverUriEntry> = [
    {
      uri: `${base}/discussions.atom`,
      hint: composeHint('github:discussions'),
    },
  ]

  if (category) {
    uris.push({
      uri: `${base}/discussions/categories/${category}.atom`,
      hint: composeHint('github:discussion-category'),
    })
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
  const [first, second, third] = getPathSegments(url)
  const discussionCategory = pathname.match(discussionCategoryRegex)?.[1]

  if (isAnyOf(first, 'orgs') && second && isAnyOf(third, 'discussions')) {
    return { kind: 'discussions', org: second, discussionCategory }
  }

  // An organization page sits under /orgs/, and its feed is the owner feed.
  if (isAnyOf(first, 'orgs') && second) {
    return { kind: 'user', owner: second }
  }

  const owner = second ? first : first?.replace(userRouteSuffixRegex, '')

  // GitHub names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (!owner || owner.includes('.')) {
    return
  }

  if (second) {
    const fileMatch = pathname.match(fileRegex)

    return {
      kind: 'repo',
      owner,
      repo: second,
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
      return [
        {
          uri: `https://github.com/${parsed.owner}.atom`,
          hint: composeHint('github:activity'),
        },
      ]
    }

    // Organization discussions page: /orgs/{org}/discussions.
    if (parsed.kind === 'discussions') {
      return getDiscussionFeeds(`https://github.com/orgs/${parsed.org}`, parsed.discussionCategory)
    }

    const { owner, repo, section, discussionCategory, branch, file } = parsed
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
    if (section === 'wiki') {
      uris.push({
        uri: `https://github.com/${owner}/${repo}/wiki.atom`,
        hint: composeHint('github:wiki'),
      })
    }

    if (section === 'discussions') {
      uris.push(...getDiscussionFeeds(`https://github.com/${owner}/${repo}`, discussionCategory))
    }

    // If on a specific branch, add branch-specific commits feed.
    if (branch) {
      uris.push({
        uri: `https://github.com/${owner}/${repo}/commits/${branch}.atom`,
        hint: composeHint('github:branch-commits'),
      })
    }

    // If viewing a file (blob) or file history (commits), add file-specific commits feed.
    if (file) {
      uris.push({
        uri: `https://github.com/${owner}/${repo}/commits/${file.branch}/${file.path}.atom`,
        hint: composeHint('github:file-history'),
      })
    }

    return uris
  },
}
