import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers activity, files, project.

export type SourceforgeUrl = { kind: 'project'; project: string }

const hosts = ['sourceforge.net', 'www.sourceforge.net']
const projectPrefixes = ['projects', 'p']

export const parseSourceforgeUrl = (url: string): SourceforgeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [prefix, project] = parsedUrl.pathname.split('/').filter(Boolean)

  if (!prefix || !project || !isAnyOf(prefix, projectPrefixes)) {
    return
  }

  // SourceForge redirects a project name in any case to the lowercase one its feed and icon URLs
  // answer under.
  return { kind: 'project', project: project.toLowerCase() }
}

export const sourceforgeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const project = parseSourceforgeUrl(url)?.project

    if (!project) {
      return []
    }

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
        hint: composeHint('sourceforge:news', 'rss'),
      },
      {
        uri: `${origin}/p/${project}/news/feed.atom`,
        hint: composeHint('sourceforge:news', 'atom'),
      },
      {
        uri: `${origin}/p/${project}/discussion/feed`,
        hint: composeHint('sourceforge:discussion', 'rss'),
      },
      {
        uri: `${origin}/p/${project}/discussion/feed.atom`,
        hint: composeHint('sourceforge:discussion', 'atom'),
      },
      {
        uri: `${origin}/p/${project}/bugs/feed`,
        hint: composeHint('sourceforge:bugs'),
      },
    ]
  },
}
