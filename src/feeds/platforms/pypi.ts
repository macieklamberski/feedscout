import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PypiUrl = { kind: 'project'; project: string } | { kind: 'home' }

const hosts = ['pypi.org', 'www.pypi.org']

const projectRegex = /^\/project\/([\w.-]+)(?:\/|$)/i

export const parsePypiUrl = (url: string): PypiUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const project = pathname.match(projectRegex)?.[1]

  if (project) {
    return { kind: 'project', project }
  }

  if (pathname === '/') {
    return { kind: 'home' }
  }
}

export const pypiHandler: PlatformHandler = {
  match: (url) => {
    return parsePypiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePypiUrl(url)

    if (!parsed) {
      return []
    }

    // The feed path answers for any case and any of `-`, `_` and `.` in the project name.
    if (parsed.kind === 'project') {
      return [
        {
          uri: `https://pypi.org/rss/project/${parsed.project}/releases.xml`,
          hint: composeHint('pypi:releases'),
        },
      ]
    }

    return [
      {
        uri: 'https://pypi.org/rss/packages.xml',
        hint: composeHint('pypi:new-packages'),
      },
      {
        uri: 'https://pypi.org/rss/updates.xml',
        hint: composeHint('pypi:updates'),
      },
    ]
  },
}
