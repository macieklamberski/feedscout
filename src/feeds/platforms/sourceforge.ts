import { sourceforge } from 'feedintel'
import { decodePercent, getPathSegments, isAnyOf, isHostOf, isPresent, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: bugs.
// Handler needed for: activity, discussion, files, news, project-feed.

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

const feeds = withHintLabels(sourceforge.feeds)

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

// A tool with rows of its own, as `bugs` or `news`, is read by them, and its feeds are among the
// project's.
const isGenericTool = (project: string, tool: string): boolean => {
  const toolFeedUrl = feeds.getFeedUrl('tool', { project, tool }, 'rss')

  if (!toolFeedUrl) {
    return false
  }

  return feeds.getFeedHint(toolFeedUrl)?.key === 'sourceforge:tool'
}

export const sourceforgeHandler: PlatformHandler = {
  match: (url) => {
    return parseSourceforgeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSourceforgeUrl(url)

    if (!parsed) {
      return []
    }

    const { project, forum, thread, tool, page, path } = parsed

    if (path) {
      return [
        feeds.getFeedEntry('activity', { project }, 'rss'),
        feeds.getFeedEntry('activity', { project }, 'atom'),
        feeds.getFeedEntry('project-feed', { project }, 'rss'),
        feeds.getFeedEntry('project-feed', { project }, 'atom'),
        feeds.getFeedEntry('files', { project }),
        feeds.getFeedEntry('news', { project }, 'rss'),
        feeds.getFeedEntry('news', { project }, 'atom'),
        feeds.getFeedEntry('discussion', { project }, 'rss'),
        feeds.getFeedEntry('discussion', { project }, 'atom'),
        feeds.getFeedEntry('bugs', { project }, 'rss'),
        feeds.getFeedEntry('bugs', { project }, 'atom'),
        feeds.getFeedEntry('files-folder', { project, path }),
      ].filter(isPresent)
    }

    if (thread) {
      return [
        feeds.getFeedEntry('activity', { project }, 'rss'),
        feeds.getFeedEntry('activity', { project }, 'atom'),
        feeds.getFeedEntry('project-feed', { project }, 'rss'),
        feeds.getFeedEntry('project-feed', { project }, 'atom'),
        feeds.getFeedEntry('files', { project }),
        feeds.getFeedEntry('news', { project }, 'rss'),
        feeds.getFeedEntry('news', { project }, 'atom'),
        feeds.getFeedEntry('discussion', { project }, 'rss'),
        feeds.getFeedEntry('discussion', { project }, 'atom'),
        feeds.getFeedEntry('bugs', { project }, 'rss'),
        feeds.getFeedEntry('bugs', { project }, 'atom'),
        feeds.getFeedEntry('discussion-thread', { project, forum, thread }, 'rss'),
        feeds.getFeedEntry('discussion-thread', { project, forum, thread }, 'atom'),
      ].filter(isPresent)
    }

    if (forum) {
      return [
        feeds.getFeedEntry('activity', { project }, 'rss'),
        feeds.getFeedEntry('activity', { project }, 'atom'),
        feeds.getFeedEntry('project-feed', { project }, 'rss'),
        feeds.getFeedEntry('project-feed', { project }, 'atom'),
        feeds.getFeedEntry('files', { project }),
        feeds.getFeedEntry('news', { project }, 'rss'),
        feeds.getFeedEntry('news', { project }, 'atom'),
        feeds.getFeedEntry('discussion', { project }, 'rss'),
        feeds.getFeedEntry('discussion', { project }, 'atom'),
        feeds.getFeedEntry('bugs', { project }, 'rss'),
        feeds.getFeedEntry('bugs', { project }, 'atom'),
        feeds.getFeedEntry('discussion-forum', { project, forum }, 'rss'),
        feeds.getFeedEntry('discussion-forum', { project, forum }, 'atom'),
      ].filter(isPresent)
    }

    // A tool every project has serves its own feed, and a page of any tool serves the page's.
    if (tool && isGenericTool(project, tool)) {
      return [
        feeds.getFeedEntry('activity', { project }, 'rss'),
        feeds.getFeedEntry('activity', { project }, 'atom'),
        feeds.getFeedEntry('project-feed', { project }, 'rss'),
        feeds.getFeedEntry('project-feed', { project }, 'atom'),
        feeds.getFeedEntry('files', { project }),
        feeds.getFeedEntry('news', { project }, 'rss'),
        feeds.getFeedEntry('news', { project }, 'atom'),
        feeds.getFeedEntry('discussion', { project }, 'rss'),
        feeds.getFeedEntry('discussion', { project }, 'atom'),
        feeds.getFeedEntry('bugs', { project }, 'rss'),
        feeds.getFeedEntry('bugs', { project }, 'atom'),
        feeds.getFeedEntry('tool', { project, tool }, 'rss'),
        feeds.getFeedEntry('tool', { project, tool }, 'atom'),
        feeds.getFeedEntry('tool-page', { project, tool, page }, 'rss'),
        feeds.getFeedEntry('tool-page', { project, tool, page }, 'atom'),
      ].filter(isPresent)
    }

    return [
      feeds.getFeedEntry('activity', { project }, 'rss'),
      feeds.getFeedEntry('activity', { project }, 'atom'),
      feeds.getFeedEntry('project-feed', { project }, 'rss'),
      feeds.getFeedEntry('project-feed', { project }, 'atom'),
      feeds.getFeedEntry('files', { project }),
      feeds.getFeedEntry('news', { project }, 'rss'),
      feeds.getFeedEntry('news', { project }, 'atom'),
      feeds.getFeedEntry('discussion', { project }, 'rss'),
      feeds.getFeedEntry('discussion', { project }, 'atom'),
      feeds.getFeedEntry('bugs', { project }, 'rss'),
      feeds.getFeedEntry('bugs', { project }, 'atom'),
      feeds.getFeedEntry('tool-page', { project, tool, page }, 'rss'),
      feeds.getFeedEntry('tool-page', { project, tool, page }, 'atom'),
    ].filter(isPresent)
  },

  getFeedHint: feeds.getFeedHint,
}
