import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers group (guess, html), partly covers commits, project, tree.

export type GitlabUrl =
  | { kind: 'namespace'; namespace: string }
  | { kind: 'project'; namespace: string; projectPath: string; branch?: string }

export const hosts = ['gitlab.com', 'www.gitlab.com']
// GitLab names may contain dots, so only the feed suffix is cut off.
const feedSuffixRegex = /\.atom$/i
const excludedPaths = [
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

export const parseGitlabUrl = (url: string): GitlabUrl | undefined => {
  const [projectSegments, featureSegments] = splitProjectPath(getPathSegments(url))
  const [first, ...rest] = projectSegments
  const namespace = first?.replace(feedSuffixRegex, '')

  if (!namespace || isAnyOf(namespace, excludedPaths)) {
    return
  }

  if (rest.length === 0) {
    return { kind: 'namespace', namespace }
  }

  const projectPath = [namespace, ...rest].join('/')

  // Branch commits or tree page: .../-/(commits|tree)/{branch}.
  if (isAnyOf(featureSegments[0], legacyFeaturePaths) && featureSegments[1]) {
    return { kind: 'project', namespace, projectPath, branch: featureSegments[1] }
  }

  return { kind: 'project', namespace, projectPath }
}

export const gitlabHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseGitlabUrl(url)

    if (!parsed) {
      return false
    }

    if (isHostOf(url, hosts)) {
      return true
    }

    // `og:site_name` is operator-set text, so a self-hosted match also needs a
    // project path or the `/-/` separator.
    if (parsed.kind === 'namespace' && !parseUrl(url)?.pathname.includes('/-/')) {
      return false
    }

    if (content && isGitlabHtml(content)) {
      return true
    }

    if (headers && isGitlabHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseGitlabUrl(url)

    // User or group page: gitlab.com/{namespace}.
    if (parsed?.kind === 'namespace') {
      return [{ uri: `${origin}/${parsed.namespace}.atom`, hint: composeHint('gitlab:activity') }]
    }

    if (parsed?.kind !== 'project') {
      return []
    }

    // Project page: gitlab.com/{group}/{subgroup...}/{project}.
    const { projectPath, branch } = parsed
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

    if (branch) {
      repoFeeds.unshift({
        uri: `${origin}/${projectPath}/-/commits/${branch}?format=atom`,
        hint: composeHint('gitlab:branch-commits'),
      })
    }

    return repoFeeds
  },
}
