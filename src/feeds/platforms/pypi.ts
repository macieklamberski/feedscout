import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, project (html).
// Handler needed for: version.

const hosts = ['pypi.org', 'www.pypi.org']

const projectRegex = /^\/project\/([\w.-]+)(?:\/|$)/i

export const pypiHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const project = pathname.match(projectRegex)?.[1]

    // The feed path answers for any case and any of `-`, `_` and `.` in the project name.
    if (project) {
      return [
        {
          uri: `https://pypi.org/rss/project/${project}/releases.xml`,
          hint: composeHint('pypi:releases'),
        },
      ]
    }

    if (pathname === '/') {
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
    }

    return []
  },
}
