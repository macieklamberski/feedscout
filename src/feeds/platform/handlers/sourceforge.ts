import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

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
