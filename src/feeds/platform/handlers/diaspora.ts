import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// A diaspora* profile is served at `/u/{user}` and its Atom feed at
// `/public/{user}`, with no extension and no `alternate` link. Without the
// handler discovery returns the project's own blog on an unrelated host, so
// this replaces a wrong answer rather than a missing one.
//
// The marker is the `Diaspora.Page` global. The `og:site_name` value is
// operator-set text that two of three pods had changed, so it is not used.
//
// A wrong username answers 200 `text/html` with the pod's normal page shell,
// so neither status nor content-type tells a live profile from a dead one.
//
// Pods that keep profiles behind a session answer `/u/{user}` with a 302 to
// the pod root, which drops the username before a handler ever sees the URL.
// Those pods are reachable only by passing the profile URL and its content in
// together.

const profileRegex = /^\/(?:u|public|people)\/([^/]+)/

export const isDiasporaHtml = (content: string): boolean => {
  return content.includes('Diaspora.Page')
}

export const diasporaHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isDiasporaHtml(content)) {
        return false
      }

      return profileRegex.test(new URL(url).pathname)
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const match = pathname.match(profileRegex)

      if (!match?.[1]) {
        return []
      }

      return [
        {
          uri: `${origin}/public/${match[1]}`,
          hint: composeHint('diaspora:posts'),
        },
      ]
    } catch {}

    return []
  },
}
