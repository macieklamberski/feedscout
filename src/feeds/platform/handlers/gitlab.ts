import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// GitLab serves Atom feeds at predictable suffixes — `/{user}.atom`,
// `/{user}/{repo}.atom`, `/-/releases.atom`, `/-/issues.atom`,
// `/-/merge_requests.atom`, `/-/tags?format=atom`, and
// `/-/commits/{branch}?format=atom` — and most user, project, and commit
// pages link them via HTML `<link rel="alternate">`. The handler is kept
// to emit the full bouquet of repo feeds and the branch-commits variant
// in one resolve call, and to identify self-hosted GitLab via the
// `og:site_name` meta tag or `x-gitlab-meta` header.

export const hosts = ['gitlab.com', 'www.gitlab.com']
export const excludedPaths = [
  'explore',
  'dashboard',
  'projects',
  'groups',
  'search',
  'admin',
  'help',
  'assets',
  'users',
  'api',
  'jwt',
  'oauth',
  'profile',
  'snippets',
  'abuse_reports',
  'invites',
  'import',
  'uploads',
  'robots.txt',
  'sitemap',
  '-',
]

export const isGitlabHtml = (content: string): boolean => {
  return hasMetaContent(content, 'og:site_name', 'GitLab')
}

export const isGitlabHeaders = (headers: Headers): boolean => {
  return headers.has('x-gitlab-meta')
}

export const gitlabHandler: PlatformHandler = {
  match: (url, content, headers) => {
    // Fast path for gitlab.com.
    if (isHostOf(url, hosts)) {
      return true
    }

    // Self-hosted instances require content or headers to confirm.
    try {
      const { pathname } = new URL(url)
      const pathSegments = pathname.split('/').filter(Boolean)

      if (pathSegments.length === 0) {
        return false
      }

      if (content && isGitlabHtml(content)) {
        return true
      }

      if (headers && isGitlabHeaders(headers)) {
        return true
      }
    } catch {}

    return false
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // User/org page: gitlab.com/{user}
    if (pathSegments.length === 1) {
      const user = pathSegments[0]

      if (!isAnyOf(user, excludedPaths)) {
        return [{ uri: `${origin}/${user}.atom`, hint: composeHint('gitlab:activity') }]
      }
    }

    // Repo page: gitlab.com/{user}/{repo}
    if (pathSegments.length >= 2) {
      const user = pathSegments[0]
      const repo = pathSegments[1]

      if (!isAnyOf(user, excludedPaths)) {
        const repoFeeds = [
          {
            uri: `${origin}/${user}/${repo}/-/releases.atom`,
            hint: composeHint('gitlab:releases'),
          },
          {
            uri: `${origin}/${user}/${repo}/-/tags?format=atom`,
            hint: composeHint('gitlab:tags'),
          },
          {
            uri: `${origin}/${user}/${repo}/-/issues.atom`,
            hint: composeHint('gitlab:issues'),
          },
          {
            uri: `${origin}/${user}/${repo}/-/merge_requests.atom`,
            hint: composeHint('gitlab:merge-requests'),
          },
          {
            uri: `${origin}/${user}/${repo}.atom`,
            hint: composeHint('gitlab:activity'),
          },
        ]

        // Branch commits/tree page: gitlab.com/{user}/{repo}/-/(commits|tree)/{branch}
        if (
          pathSegments[2] === '-' &&
          (pathSegments[3] === 'commits' || pathSegments[3] === 'tree') &&
          pathSegments[4]
        ) {
          const branch = pathSegments[4]

          repoFeeds.unshift({
            uri: `${origin}/${user}/${repo}/-/commits/${branch}?format=atom`,
            hint: composeHint('gitlab:branch-commits'),
          })
        }

        return repoFeeds
      }
    }

    return []
  },
}
