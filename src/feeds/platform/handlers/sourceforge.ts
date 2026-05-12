import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// SourceForge projects at `/projects/{p}` and `/p/{p}` expose feeds at
// several mount points — activity, files (`/projects/{p}/rss`), news
// (RSS and Atom), discussion (RSS and Atom), and bugs — but the project
// page's `<link rel="alternate">` only autodiscovers the activity feed.
// The handler emits the full set so callers get news, discussion, and
// bug-tracker feeds that generic discovery misses.

export const hosts = ['sourceforge.net', 'www.sourceforge.net']

export const sourceforgeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Project pages can be at either /projects/{project} or /p/{project}.
    const isProject = (pathSegments[0] === 'projects' || pathSegments[0] === 'p') && pathSegments[1]

    if (isProject) {
      const project = pathSegments[1]

      return [
        {
          uri: `${origin}/p/${project}/activity/feed`,
          hint: composeHint('sourceforge:activity'),
        },
        {
          uri: `${origin}/p/${project}/feed`,
          hint: composeHint('sourceforge:project-feed'),
        },
        {
          uri: `${origin}/projects/${project}/rss`,
          hint: composeHint('sourceforge:files'),
        },
        {
          uri: `${origin}/p/${project}/news/feed.rss`,
          hint: composeHint('sourceforge:news-rss'),
        },
        {
          uri: `${origin}/p/${project}/news/feed.atom`,
          hint: composeHint('sourceforge:news-atom'),
        },
        {
          uri: `${origin}/p/${project}/discussion/feed`,
          hint: composeHint('sourceforge:discussion'),
        },
        {
          uri: `${origin}/p/${project}/discussion/feed.atom`,
          hint: composeHint('sourceforge:discussion-atom'),
        },
        {
          uri: `${origin}/p/${project}/bugs/feed`,
          hint: composeHint('sourceforge:bugs'),
        },
      ]
    }

    return []
  },
}
