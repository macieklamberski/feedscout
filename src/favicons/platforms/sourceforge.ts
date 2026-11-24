import { sourceforge } from 'feedintel'
import { decodePercent, getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// A discussion page names its forum and thread, a tool page its tool and page, and a files page its
// folder.
export type SourceforgeUrl = {
  kind: 'project'
  project: string
  forum?: string
  thread?: string
  tool?: string
  page?: string
  path?: string
}

const hosts = sourceforge.hosts.exact
const projectPrefixes = ['projects', 'p']

export const parseSourceforgeUrl = (url: string): SourceforgeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const segments = getPathSegments(parsedUrl)
  const [prefix, project, tool, page, threadWord, thread] = segments

  if (!project || !isAnyOf(prefix, projectPrefixes)) {
    return
  }

  // A files page links the feed of its folder, as `rss?path=/Win64` on `files/Win64/`.
  if (isAnyOf(prefix, 'projects') && isAnyOf(tool, 'files') && page) {
    return { kind: 'project', project, path: `/${segments.slice(3).map(decodePercent).join('/')}` }
  }

  if (!isAnyOf(prefix, 'p') || !tool) {
    return { kind: 'project', project }
  }

  if (isAnyOf(tool, 'discussion') && page) {
    if (isAnyOf(threadWord, 'thread') && thread) {
      return { kind: 'project', project, forum: page, thread }
    }

    return { kind: 'project', project, forum: page }
  }

  // A page feed sits one segment below its tool, as a wiki page or a ticket. A deeper path, as a
  // code tree, links the tool feed only.
  return { kind: 'project', project, tool, page: segments.length === 4 ? page : undefined }
}

export const sourceforgeHandler: PlatformHandler = {
  match: (url) => {
    return parseSourceforgeUrl(url) !== undefined
  },

  resolve: (url) => {
    const project = parseSourceforgeUrl(url)?.project

    if (!project) {
      return []
    }

    return [{ uri: `https://a.fsdn.com/allura/p/${project}/icon` }]
  },
}
