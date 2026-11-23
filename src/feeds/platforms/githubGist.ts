import { githubGist } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: gists, starred.
// Handler needed for: discover, forks.

export type GithubGistUrl =
  | { kind: 'user'; username: string }
  | { kind: 'starred'; username: string }
  | { kind: 'forks'; username: string }
  | { kind: 'discover' }

const feeds = withHintLabels(githubGist.feeds)

// A gist page, /{username}/{gist-id}, and the /public and /secret listings belong to the
// user's gists.
export const parseGithubGistUrl = (url: string): GithubGistUrl | undefined => {
  const page = githubGist.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'discover') {
    return { kind: 'discover' }
  }

  const { username } = page.params

  if (page.key === 'starred') {
    return { kind: 'starred', username }
  }

  if (page.key === 'forks') {
    return { kind: 'forks', username }
  }

  return { kind: 'user', username }
}

export const githubGistHandler: PlatformHandler = {
  match: (url) => {
    return parseGithubGistUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGithubGistUrl(url)

    if (!parsed) {
      return []
    }

    // The discover feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'discover') {
      return [feeds.getFeedEntry('discover')]
    }

    if (parsed.kind === 'starred') {
      return [
        feeds.getFeedEntry('starred', { username: parsed.username }),
        feeds.getFeedEntry('discover'),
      ]
    }

    if (parsed.kind === 'forks') {
      return [
        feeds.getFeedEntry('forks', { username: parsed.username }),
        feeds.getFeedEntry('discover'),
      ]
    }

    return [
      feeds.getFeedEntry('gists', { username: parsed.username }),
      feeds.getFeedEntry('discover'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
