import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers activity, files, project.

// A discussion thread page names its forum and thread too.
export type SourceforgeUrl = { kind: 'project'; project: string; forum?: string; thread?: string }

const hosts = ['sourceforge.net', 'www.sourceforge.net']
const projectPrefixes = ['projects', 'p']

// SourceForge serves each feed at `feed`, `feed.rss` and `feed.atom`. The rows `resolve` never
// builds claim the other two spellings of each feed it emits.
const feeds = definePlatformFeeds([
  { key: 'sourceforge:activity', template: 'https://sourceforge.net/p/{project}/activity/feed' },
  {
    key: 'sourceforge:activity',
    template: 'https://sourceforge.net/p/{project}/activity/feed.rss',
    format: 'rss',
  },
  {
    key: 'sourceforge:activity',
    template: 'https://sourceforge.net/p/{project}/activity/feed.atom',
    format: 'atom',
  },
  { key: 'sourceforge:project-feed', template: 'https://sourceforge.net/p/{project}/feed' },
  {
    key: 'sourceforge:project-feed',
    template: 'https://sourceforge.net/p/{project}/feed.rss',
    format: 'rss',
  },
  {
    key: 'sourceforge:project-feed',
    template: 'https://sourceforge.net/p/{project}/feed.atom',
    format: 'atom',
  },
  { key: 'sourceforge:files', template: 'https://sourceforge.net/projects/{project}/rss' },
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
  { key: 'sourceforge:bugs', template: 'https://sourceforge.net/p/{project}/bugs/feed' },
  {
    key: 'sourceforge:bugs',
    template: 'https://sourceforge.net/p/{project}/bugs/feed.rss',
    format: 'rss',
  },
  {
    key: 'sourceforge:bugs',
    template: 'https://sourceforge.net/p/{project}/bugs/feed.atom',
    format: 'atom',
  },
  {
    key: 'sourceforge:activity',
    template: 'https://sourceforge.net/mirror/{project}/activity/feed',
  },
  {
    key: 'sourceforge:activity',
    template: 'https://sourceforge.net/mirror/{project}/activity/feed.rss',
    format: 'rss',
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
  // mounts above.
  {
    key: 'sourceforge:tool',
    template: 'https://sourceforge.net/p/{project}/{tool}/feed',
    format: 'rss',
  },
  {
    key: 'sourceforge:tool',
    template: 'https://sourceforge.net/p/{project}/{tool}/feed.rss',
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
    template: 'https://sourceforge.net/p/{project}/{tool}/{page}/feed',
    format: 'rss',
  },
  {
    key: 'sourceforge:tool-page',
    template: 'https://sourceforge.net/p/{project}/{tool}/{page}/feed.rss',
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

  const [prefix, project, tool, forum, threadWord, thread] = getPathSegments(parsedUrl)

  if (!project || !isAnyOf(prefix, projectPrefixes)) {
    return
  }

  if (
    isAnyOf(prefix, 'p') &&
    isAnyOf(tool, 'discussion') &&
    isAnyOf(threadWord, 'thread') &&
    thread
  ) {
    return { kind: 'project', project, forum, thread }
  }

  return { kind: 'project', project }
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

    const { project, forum, thread } = parsed

    if (thread) {
      return [
        feeds.getFeedEntry('sourceforge:activity', { project }),
        feeds.getFeedEntry('sourceforge:project-feed', { project }),
        feeds.getFeedEntry('sourceforge:files', { project }),
        feeds.getFeedEntry('sourceforge:news', { project }, 'rss'),
        feeds.getFeedEntry('sourceforge:news', { project }, 'atom'),
        feeds.getFeedEntry('sourceforge:discussion', { project }, 'rss'),
        feeds.getFeedEntry('sourceforge:discussion', { project }, 'atom'),
        feeds.getFeedEntry('sourceforge:bugs', { project }),
        feeds.getFeedEntry('sourceforge:discussion-thread', { project, forum, thread }, 'rss'),
        feeds.getFeedEntry('sourceforge:discussion-thread', { project, forum, thread }, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('sourceforge:activity', { project }),
      feeds.getFeedEntry('sourceforge:project-feed', { project }),
      feeds.getFeedEntry('sourceforge:files', { project }),
      feeds.getFeedEntry('sourceforge:news', { project }, 'rss'),
      feeds.getFeedEntry('sourceforge:news', { project }, 'atom'),
      feeds.getFeedEntry('sourceforge:discussion', { project }, 'rss'),
      feeds.getFeedEntry('sourceforge:discussion', { project }, 'atom'),
      feeds.getFeedEntry('sourceforge:bugs', { project }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
