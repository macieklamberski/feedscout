import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

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
        return [
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
      }
    }

    return []
  },
}
