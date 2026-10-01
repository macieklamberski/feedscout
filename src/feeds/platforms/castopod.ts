import { decodeSegment, getPathSegments } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const colorsPathRegex = /\/themes\/colors$/
const handleRegex = /^@(\w+)$/

export type CastopodPage = { rootUrl: string; handle: string }

// Core prints the theme colors stylesheet in every page head, at the install's root. Every page
// under `/@{handle}` belongs to that podcast, and a remote actor's `@user@domain` has no feed here.
const getCastopodPage = (url: string, content: string | undefined): CastopodPage | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'link' && colorsPathRegex.test(element.attribs.href ?? '')
  })

  if (!link?.attribs.href) {
    return
  }

  const rootPath = new URL(link.attribs.href, url).pathname.replace(colorsPathRegex, '')
  const rootUrl = `${new URL(url).origin}${rootPath}`
  const handleSegment = getPathSegments(url)[getPathSegments(rootUrl).length]
  const handle = decodeSegment(handleSegment)?.match(handleRegex)?.[1]

  if (!handle) {
    return
  }

  return { rootUrl, handle }
}

export const castopodHandler: PlatformHandler = {
  match: (url, content) => {
    return getCastopodPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getCastopodPage(url, content)

    if (!page) {
      return []
    }

    return [
      { uri: `${page.rootUrl}/@${page.handle}/feed.xml`, hint: composeHint('castopod:podcast') },
    ]
  },
}
