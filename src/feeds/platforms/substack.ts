import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (guess, html).
// Handler needed for: profile.

const profileRegex = /^\/@([\w-]+)/
// A profile page embeds its primary publication as escaped JSON. The publication
// subdomain is not always the handle, and a custom domain replaces it.
const publicationRegex =
  /primaryPublication\\?":\{[^}]*?\\?"subdomain\\?":\\?"([\w-]+)\\?",\\?"custom_domain\\?":(?:\\?"([^"\\]+)\\?"|null)/

const getPublicationOrigin = (content: string | undefined): string | undefined => {
  const match = content?.match(publicationRegex)

  if (!match?.[1]) {
    return
  }

  return match[2] ? `https://${match[2]}` : `https://${match[1]}.substack.com`
}

export const substackHandler: PlatformHandler = {
  match: (url) => {
    if (isSubdomainOf(url, 'substack.com')) {
      return true
    }

    return isHostOf(url, 'substack.com') && profileRegex.test(new URL(url).pathname)
  },

  resolve: (url, content) => {
    const parsed = new URL(url)
    const profileMatch = parsed.pathname.match(profileRegex)

    if (isHostOf(url, 'substack.com') && profileMatch?.[1]) {
      const origin = getPublicationOrigin(content) ?? `https://${profileMatch[1]}.substack.com`

      return [
        {
          uri: `${origin}/feed`,
          hint: composeHint('substack:newsletter'),
        },
      ]
    }

    return [{ uri: `${parsed.origin}/feed`, hint: composeHint('substack:newsletter') }]
  },
}
