import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers activity, files, project.

export type SourceforgeUrl = { kind: 'project'; project: string }

const hosts = ['sourceforge.net', 'www.sourceforge.net']
const projectPrefixes = ['projects', 'p']

// SourceForge serves each feed at `feed`, `feed.rss` and `feed.atom`, so the rows `resolve` never
// builds claim the other spellings.
const feeds = definePlatformFeeds([
  { key: 'sourceforge:activity', template: 'https://sourceforge.net/p/{project}/activity/feed' },
  { key: 'sourceforge:project-feed', template: 'https://sourceforge.net/p/{project}/feed' },
  { key: 'sourceforge:project-feed', template: 'https://sourceforge.net/p/{project}/feed.rss' },
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
    template: 'https://sourceforge.net/p/{project}/discussion/feed.atom',
    format: 'atom',
  },
  { key: 'sourceforge:bugs', template: 'https://sourceforge.net/p/{project}/bugs/feed' },
])

export const parseSourceforgeUrl = (url: string): SourceforgeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [prefix, project] = getPathSegments(parsedUrl)

  if (!project || !isAnyOf(prefix, projectPrefixes)) {
    return
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

    const { project } = parsed

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

  getFeedKey: feeds.getFeedKey,
}
