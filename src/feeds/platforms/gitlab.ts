import { gitlab } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: branch-commits.
// Handler needed for: activity, issues, merge-requests, releases, tags.

export type GitlabUrl =
  | { kind: 'namespace'; namespace: string }
  | { kind: 'project'; namespace: string; projectPath: string; branch?: string }

const feeds = withHintLabels(gitlab.feeds)

// Every GitLab page prints its frontend config through the gon gem and loads its bundles from
// /assets/webpack/. The og:site_name is operator-set text, which any page can carry.
export const isGitlabHtml = (content: string): boolean => {
  return content.includes('window.gon={}') && content.includes('/assets/webpack/')
}

export const isGitlabHeaders = (headers: Headers): boolean => {
  return headers.has('x-gitlab-meta')
}

export const parseGitlabUrl = (url: string): GitlabUrl | undefined => {
  const page = gitlab.pages.read(url, { root: parseUrl(url)?.origin ?? '' })

  if (!page) {
    return
  }

  const { group, user, namespace, project: projectPath, branch } = page.params

  if (page.key === 'group') {
    return { kind: 'namespace', namespace: group }
  }

  if (page.key === 'user') {
    return { kind: 'namespace', namespace: user }
  }

  if (page.key === 'namespace') {
    return { kind: 'namespace', namespace }
  }

  const [projectNamespace] = projectPath.split('/')

  if (page.key === 'branch') {
    return { kind: 'project', namespace: projectNamespace, projectPath, branch }
  }

  return { kind: 'project', namespace: projectNamespace, projectPath }
}

export const gitlabHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!parseGitlabUrl(url)) {
      return false
    }

    const page = gitlab.pages.read(url)

    if (page) {
      return page.key !== 'platform'
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
