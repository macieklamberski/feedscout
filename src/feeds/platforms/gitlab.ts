import { getPathSegments, isAnyOf, isHostOf, isSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers group (guess, html), partly covers commits, project, tree.

export type GitlabUrl =
  | { kind: 'namespace'; namespace: string }
  | { kind: 'project'; namespace: string; projectPath: string; branch?: string }

export const hosts = ['gitlab.com', 'www.gitlab.com']

// GitLab names may contain dots, so only the feed suffix is cut off.
const feedSuffixRegex = /\.atom$/i

// The feeds of every GitLab install. The table claims a feed only on gitlab.com: a self-hosted
// instance is known by its page markup, which a feed URL does not carry. A project path has any
// depth and ends at a `/-/` separator, not always the first: in
// `/{ns}/{project}/-/{x}/-/releases.atom` the project is `{ns}/{project}/-/{x}`.
const feeds = definePlatformFeeds(
  [
    {
      key: 'gitlab:branch-commits',
      main: '{root}/{project*}/-/commits/{branch}?format=atom',
      aliases: [
        // `/-/commits/{branch}.atom` serves the bytes `?format=atom` does. Under a file path GitLab
        // reads the suffix as part of the file and redirects to the tree.
        '{root}/{project*}/-/commits/{branch}.atom',
      ],
    },
    // The commits of one file or folder under a branch, another feed under the same key.
    {
      key: 'gitlab:branch-commits',
      main: '{root}/{project*}/-/commits/{branch}/{path*}?format=atom',
    },
    { key: 'gitlab:releases', main: '{root}/{project*}/-/releases.atom' },
    { key: 'gitlab:tags', main: '{root}/{project*}/-/tags?format=atom' },
    { key: 'gitlab:issues', main: '{root}/{project*}/-/issues.atom' },
    { key: 'gitlab:merge-requests', main: '{root}/{project*}/-/merge_requests.atom' },
    // The signed-in user's dashboard feeds answer only with their `feed_token`, so they are
    // claimed and never built.
    { key: 'gitlab:dashboard', main: '{root}/dashboard/projects.atom' },
    { key: 'gitlab:dashboard-issues', main: '{root}/dashboard/issues.atom' },
    { key: 'gitlab:dashboard-merge-requests', main: '{root}/dashboard/merge_requests.atom' },
    // A namespace or a project of any depth, after the rows its paths overlap.
    { key: 'gitlab:activity', main: '{root}/{path*}.atom' },
  ],
  { hosts: { exact: hosts } },
)

// Every GitLab page prints its frontend config through the gon gem and loads its bundles from
// /assets/webpack/. The og:site_name is operator-set text, which any page can carry.
export const isGitlabHtml = (content: string): boolean => {
  return content.includes('window.gon={}') && content.includes('/assets/webpack/')
}

export const isGitlabHeaders = (headers: Headers): boolean => {
  return headers.has('x-gitlab-meta')
}

// Legacy project URLs put the feature straight after the project path, with no
// `-` separator. A project can itself be named `tree`, so never cut at the
// second segment.
const legacyFeaturePaths = ['tree', 'commits']

const accountPrefixes = ['groups', 'users']

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
  const segments = getPathSegments(url)
  const [prefixOrNamespace, account] = segments

  // A group or user page and its tabs sit under /groups/ or /users/, before the account name.
  if (isAnyOf(prefixOrNamespace, accountPrefixes) && account) {
    // A subgroup is named by every segment before the `/-/` separator.
    if (isAnyOf(prefixOrNamespace, 'groups')) {
      const dashIndex = segments.indexOf('-')
      const groupSegments = segments.slice(1, dashIndex === -1 ? undefined : dashIndex)

      return { kind: 'namespace', namespace: groupSegments.join('/') }
    }

    return { kind: 'namespace', namespace: account }
  }

  const [projectSegments, featureSegments] = splitProjectPath(segments)
  const [first, ...rest] = projectSegments
  const namespace = first?.replace(feedSuffixRegex, '')

  if (!namespace) {
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
    if (!parseGitlabUrl(url)) {
      return false
    }

    if (isHostOf(url, hosts)) {
      return true
    }

    // GitLab's own subdomains, such as about.gitlab.com, are its marketing and docs sites.
    if (isSubdomainOf(url, hosts)) {
      return false
    }

    return hasMarker(content, headers, { html: isGitlabHtml, headers: isGitlabHeaders })
  },

  resolve: (url) => {
    const parsed = parseGitlabUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // User or group page: gitlab.com/{namespace}.
    if (parsed.kind === 'namespace') {
      return [page.getFeedEntry('gitlab:activity', { path: parsed.namespace })]
    }

    // Project page: gitlab.com/{group}/{subgroup...}/{project}.
    const { projectPath: project, branch } = parsed

    if (branch) {
      return [
        page.getFeedEntry('gitlab:branch-commits', { project, branch }),
        page.getFeedEntry('gitlab:releases', { project }),
        page.getFeedEntry('gitlab:tags', { project }),
        page.getFeedEntry('gitlab:issues', { project }),
        page.getFeedEntry('gitlab:merge-requests', { project }),
        page.getFeedEntry('gitlab:activity', { path: project }),
      ]
    }

    return [
      page.getFeedEntry('gitlab:releases', { project }),
      page.getFeedEntry('gitlab:tags', { project }),
      page.getFeedEntry('gitlab:issues', { project }),
      page.getFeedEntry('gitlab:merge-requests', { project }),
      page.getFeedEntry('gitlab:activity', { path: project }),
    ]
  },

  getFeedHint: (url) => {
    const segments = getPathSegments(url)
    const [prefixOrNamespace] = segments
    const dashIndex = segments.indexOf('-')
    // The dashboard is a route, never a namespace, and its feeds sit right under it.
    const isDashboard = isAnyOf(prefixOrNamespace, 'dashboard')

    // A group or user page is no feed, and a project path is a namespace and a project at least.
    if (
      isAnyOf(prefixOrNamespace, accountPrefixes) ||
      (isDashboard && segments.length !== 2) ||
      dashIndex === 0 ||
      dashIndex === 1
    ) {
      return
    }

    const hint = feeds.getFeedHint(url)
    // The activity row reads any path ending in `.atom`, but a route after `/-/`, the dashboard
    // and a legacy feature path name no namespace or project.
    const isRoutePath = dashIndex !== -1 || isDashboard || splitProjectPath(segments)[1].length > 0

    if (hint?.key === 'gitlab:activity' && isRoutePath) {
      return
    }

    return hint
  },
}
