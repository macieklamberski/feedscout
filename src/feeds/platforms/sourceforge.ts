import { sourceforge } from 'feedintel'
import { isPresent } from 'trousse'
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

const feeds = withHintLabels(sourceforge.feeds)

export const parseSourceforgeUrl = (url: string): SourceforgeUrl | undefined => {
  const page = sourceforge.pages.read(url)

  if (!page) {
    return
  }

  const { project } = page.params

  // The folder feed takes the path as one query value.
  if (page.key === 'files') {
    return { kind: 'project', project, path: `/${page.params.path.join('/')}` }
  }

  if (page.key === 'thread') {
    return { kind: 'project', project, forum: page.params.forum, thread: page.params.thread }
  }

  if (page.key === 'forum') {
    return { kind: 'project', project, forum: page.params.forum }
  }

  if (page.key === 'tool-page') {
    return { kind: 'project', project, tool: page.params.tool, page: page.params.page }
  }

  if (page.key === 'tool') {
    return { kind: 'project', project, tool: page.params.tool }
  }

  return { kind: 'project', project }
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
