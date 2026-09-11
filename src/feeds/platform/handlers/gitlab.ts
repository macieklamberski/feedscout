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
//
// A project path can be any depth, because groups nest. GitLab separates it
// from the feature path with `/-/`.

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

// Legacy project URLs put the feature straight after the project path, with no
// `-` separator. A project can itself be named `tree`, so never cut at the
// second segment.
const legacyFeaturePaths = ['tree', 'commits']

const splitProjectPath = (pathSegments: Array<string>): [Array<string>, Array<string>] => {
  const dashIndex = pathSegments.indexOf('-')

  if (dashIndex !== -1) {
    return [pathSegments.slice(0, dashIndex), pathSegments.slice(dashIndex + 1)]
  }

  const featureIndex = pathSegments.findIndex((segment, index) => {
    return index > 1 && isAnyOf(segment, legacyFeaturePaths)
  })

  if (featureIndex === -1) {
    return [pathSegments, []]
  }

  return [pathSegments.slice(0, featureIndex), pathSegments.slice(featureIndex)]
}

export const gitlabHandler: PlatformHandler = {
  match: (url, content, headers) => {
    try {
      const { pathname } = new URL(url)
      const [projectSegments] = splitProjectPath(pathname.split('/').filter(Boolean))

      if (projectSegments.length === 0 || isAnyOf(projectSegments[0], excludedPaths)) {
        return false
      }

      if (isHostOf(url, hosts)) {
        return true
      }

      // `og:site_name` is operator-set text, so a self-hosted match also needs a
      // project path or the `/-/` separator.
      if (projectSegments.length < 2 && !pathname.includes('/-/')) {
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
    const [projectSegments, featureSegments] = splitProjectPath(pathname.split('/').filter(Boolean))

    if (projectSegments.length === 0 || isAnyOf(projectSegments[0], excludedPaths)) {
      return []
    }

    // User, org or group page: gitlab.com/{user}
    if (projectSegments.length === 1) {
      return [{ uri: `${origin}/${projectSegments[0]}.atom`, hint: composeHint('gitlab:activity') }]
    }

    // Project page: gitlab.com/{group}/{subgroup...}/{project}
    const projectPath = projectSegments.join('/')
    const repoFeeds = [
      {
        uri: `${origin}/${projectPath}/-/releases.atom`,
        hint: composeHint('gitlab:releases'),
      },
      {
        uri: `${origin}/${projectPath}/-/tags?format=atom`,
        hint: composeHint('gitlab:tags'),
      },
      {
        uri: `${origin}/${projectPath}/-/issues.atom`,
        hint: composeHint('gitlab:issues'),
      },
      {
        uri: `${origin}/${projectPath}/-/merge_requests.atom`,
        hint: composeHint('gitlab:merge-requests'),
      },
      {
        uri: `${origin}/${projectPath}.atom`,
        hint: composeHint('gitlab:activity'),
      },
    ]

    // Branch commits or tree page: .../-/(commits|tree)/{branch}
    if (isAnyOf(featureSegments[0], legacyFeaturePaths) && featureSegments[1]) {
      repoFeeds.unshift({
        uri: `${origin}/${projectPath}/-/commits/${featureSegments[1]}?format=atom`,
        hint: composeHint('gitlab:branch-commits'),
      })
    }

    return repoFeeds
  },
}
