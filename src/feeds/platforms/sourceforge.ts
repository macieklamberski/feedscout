import { decodePercent, getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers activity, files, project.

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

const hosts = ['sourceforge.net', 'www.sourceforge.net']
const projectPrefixes = ['projects', 'p']

// SourceForge serves each feed at `feed`, `feed.rss` and `feed.atom`. The rows `resolve` never
// builds claim the other two spellings of each feed it emits.
const feeds = definePlatformFeeds([
  {
    key: 'sourceforge:activity',
    template: 'https://sourceforge.net/p/{project}/activity/feed',
    format: 'rss',
  },
  {
    key: 'sourceforge:activity',
    template: 'https://sourceforge.net/p/{project}/activity/feed.rss',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:activity',
    template: 'https://sourceforge.net/p/{project}/activity/feed.atom',
    format: 'atom',
  },
  {
    key: 'sourceforge:project-feed',
    template: 'https://sourceforge.net/p/{project}/feed',
    format: 'rss',
  },
  {
    key: 'sourceforge:project-feed',
    template: 'https://sourceforge.net/p/{project}/feed.rss',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:project-feed',
    template: 'https://sourceforge.net/p/{project}/feed.atom',
    format: 'atom',
  },
  { key: 'sourceforge:files', template: 'https://sourceforge.net/projects/{project}/rss' },
  {
    key: 'sourceforge:files',
    template: 'https://sourceforge.net/projects/{project}/rss?path=/',
    isAlias: true,
  },
  {
    key: 'sourceforge:files-folder',
    template: 'https://sourceforge.net/projects/{project}/rss?path={path}',
  },
  {
    key: 'sourceforge:news',
    template: 'https://sourceforge.net/p/{project}/news/feed.rss',
    format: 'rss',
  },
  {
    key: 'sourceforge:news',
    template: 'https://sourceforge.net/p/{project}/news/feed',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:news',
    template: 'https://sourceforge.net/p/{project}/news/feed.atom',
    format: 'atom',
  },
  {
    key: 'sourceforge:discussion',
    template: 'https://sourceforge.net/p/{project}/discussion/feed',
    format: 'rss',
  },
  {
    key: 'sourceforge:discussion',
    template: 'https://sourceforge.net/p/{project}/discussion/feed.rss',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:discussion',
    template: 'https://sourceforge.net/p/{project}/discussion/feed.atom',
    format: 'atom',
  },
  // The bugs page links `feed.rss`, so that spelling is the one `resolve` builds.
  {
    key: 'sourceforge:bugs',
    template: 'https://sourceforge.net/p/{project}/bugs/feed.rss',
    format: 'rss',
  },
  {
    key: 'sourceforge:bugs',
    template: 'https://sourceforge.net/p/{project}/bugs/feed',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:bugs',
    template: 'https://sourceforge.net/p/{project}/bugs/feed.atom',
    format: 'atom',
  },
  {
    key: 'sourceforge:activity',
    template: 'https://sourceforge.net/mirror/{project}/activity/feed',
    format: 'rss',
  },
  {
    key: 'sourceforge:activity',
    template: 'https://sourceforge.net/mirror/{project}/activity/feed.rss',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:activity',
    template: 'https://sourceforge.net/mirror/{project}/activity/feed.atom',
    format: 'atom',
  },
  {
    key: 'sourceforge:discussion-thread',
    template: 'https://sourceforge.net/p/{project}/discussion/{forum}/thread/{thread}/feed',
    format: 'rss',
  },
  {
    key: 'sourceforge:discussion-thread',
    template: 'https://sourceforge.net/p/{project}/discussion/{forum}/thread/{thread}/feed.rss',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:discussion-thread',
    template: 'https://sourceforge.net/p/{project}/discussion/{forum}/thread/{thread}/feed.atom',
    format: 'atom',
  },
  {
    key: 'sourceforge:discussion-forum',
    template: 'https://sourceforge.net/p/{project}/discussion/{forum}/feed',
    format: 'rss',
  },
  {
    key: 'sourceforge:discussion-forum',
    template: 'https://sourceforge.net/p/{project}/discussion/{forum}/feed.rss',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:discussion-forum',
    template: 'https://sourceforge.net/p/{project}/discussion/{forum}/feed.atom',
    format: 'atom',
  },
  // A tool mount names itself, as `wiki`, `blog` or a code repository, so these rows go after the
  // mounts above. Tool pages link `feed.rss`, so that spelling is the one `resolve` builds.
  {
    key: 'sourceforge:tool',
    template: 'https://sourceforge.net/p/{project}/{tool}/feed.rss',
    format: 'rss',
  },
  {
    key: 'sourceforge:tool',
    template: 'https://sourceforge.net/p/{project}/{tool}/feed',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:tool',
    template: 'https://sourceforge.net/p/{project}/{tool}/feed.atom',
    format: 'atom',
  },
  {
    key: 'sourceforge:tool-page',
    template: 'https://sourceforge.net/p/{project}/{tool}/{page}/feed.rss',
    format: 'rss',
  },
  {
    key: 'sourceforge:tool-page',
    template: 'https://sourceforge.net/p/{project}/{tool}/{page}/feed',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:tool-page',
    template: 'https://sourceforge.net/p/{project}/{tool}/{page}/feed.atom',
    format: 'atom',
  },
  {
    key: 'sourceforge:user',
    template: 'https://sourceforge.net/u/{user}/feed',
    format: 'rss',
  },
  {
    key: 'sourceforge:user',
    template: 'https://sourceforge.net/u/{user}/feed.rss',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:user',
    template: 'https://sourceforge.net/u/{user}/feed.atom',
    format: 'atom',
  },
  {
    key: 'sourceforge:user-tool',
    template: 'https://sourceforge.net/u/{user}/{tool}/feed',
    format: 'rss',
  },
  {
    key: 'sourceforge:user-tool',
    template: 'https://sourceforge.net/u/{user}/{tool}/feed.rss',
    format: 'rss',
    isAlias: true,
  },
  {
    key: 'sourceforge:user-tool',
    template: 'https://sourceforge.net/u/{user}/{tool}/feed.atom',
    format: 'atom',
  },
])

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
  const toolFeedUrl = feeds.getFeedUrl('sourceforge:tool', { project, tool }, 'rss')

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
    const hasToolFeed = tool !== undefined && isGenericTool(project, tool)

    return [
      feeds.getFeedEntry('sourceforge:activity', { project }, 'rss'),
      feeds.getFeedEntry('sourceforge:activity', { project }, 'atom'),
      feeds.getFeedEntry('sourceforge:project-feed', { project }, 'rss'),
      feeds.getFeedEntry('sourceforge:project-feed', { project }, 'atom'),
      feeds.getFeedEntry('sourceforge:files', { project }),
      feeds.getFeedEntry('sourceforge:news', { project }, 'rss'),
      feeds.getFeedEntry('sourceforge:news', { project }, 'atom'),
      feeds.getFeedEntry('sourceforge:discussion', { project }, 'rss'),
      feeds.getFeedEntry('sourceforge:discussion', { project }, 'atom'),
      feeds.getFeedEntry('sourceforge:bugs', { project }, 'rss'),
      feeds.getFeedEntry('sourceforge:bugs', { project }, 'atom'),
      ...(path ? [feeds.getFeedEntry('sourceforge:files-folder', { project, path })] : []),
      ...(forum && !thread
        ? [
            feeds.getFeedEntry('sourceforge:discussion-forum', { project, forum }, 'rss'),
            feeds.getFeedEntry('sourceforge:discussion-forum', { project, forum }, 'atom'),
          ]
        : []),
      ...(thread
        ? [
            feeds.getFeedEntry('sourceforge:discussion-thread', { project, forum, thread }, 'rss'),
            feeds.getFeedEntry('sourceforge:discussion-thread', { project, forum, thread }, 'atom'),
          ]
        : []),
      ...(hasToolFeed
        ? [
            feeds.getFeedEntry('sourceforge:tool', { project, tool }, 'rss'),
            feeds.getFeedEntry('sourceforge:tool', { project, tool }, 'atom'),
          ]
        : []),
      ...(page
        ? [
            feeds.getFeedEntry('sourceforge:tool-page', { project, tool, page }, 'rss'),
            feeds.getFeedEntry('sourceforge:tool-page', { project, tool, page }, 'atom'),
          ]
        : []),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
