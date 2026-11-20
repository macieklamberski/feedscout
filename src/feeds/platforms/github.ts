import { github } from 'feedintel'
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
      section?: string
      discussionCategory?: string
      branch?: string
      file?: { branch: string; path: string }
    }
  | { kind: 'discussions'; org: string; discussionCategory?: string }

const feeds = withHintLabels(github.feeds)

export const parseGithubUrl = (url: string): GithubUrl | undefined => {
  const page = github.pages.read(url)

  if (!page) {
    return
  }

  const { owner, repo, org, section, category, branch, path } = page.params

  if (page.key === 'user') {
    return { kind: 'user', owner }
  }

  if (page.key === 'discussions') {
    return { kind: 'discussions', org, discussionCategory: category }
  }

  if (path) {
    return { kind: 'repo', owner, repo, file: { branch, path } }
  }

  return {
    kind: 'repo',
    owner,
    repo,
    section: section?.toLowerCase(),
    discussionCategory: category,
    branch,
  }
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
