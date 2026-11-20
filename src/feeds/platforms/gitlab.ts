import { gitlab } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf, isSubdomainOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: branch-commits.
// Handler needed for: activity, issues, merge-requests, releases, tags.

export type GitlabUrl =
  | { kind: 'namespace'; namespace: string }
  | { kind: 'project'; namespace: string; projectPath: string; branch?: string }

export const hosts = gitlab.hosts.exact

// GitLab names may contain dots, so only the feed suffix is cut off.
const feedSuffixRegex = /\.atom$/i

const feeds = withHintLabels(gitlab.feeds)

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
      return [page.getFeedEntry('activity', { path: parsed.namespace })]
    }

    // Project page: gitlab.com/{group}/{subgroup...}/{project}.
    const { projectPath: project, branch } = parsed

    if (branch) {
      return [
        page.getFeedEntry('branch-commits', { project, branch }),
        page.getFeedEntry('releases', { project }),
        page.getFeedEntry('tags', { project }),
        page.getFeedEntry('issues', { project }),
        page.getFeedEntry('merge-requests', { project }),
        page.getFeedEntry('activity', { path: project }),
      ]
    }

    return [
      page.getFeedEntry('releases', { project }),
      page.getFeedEntry('tags', { project }),
      page.getFeedEntry('issues', { project }),
      page.getFeedEntry('merge-requests', { project }),
      page.getFeedEntry('activity', { path: project }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
