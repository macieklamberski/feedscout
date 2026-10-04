import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PrlogUrl = { kind: 'pressroom'; pressroomId: string }

const hosts = ['pressroom.prlog.org']

export const parsePrlogUrl = (url: string): PrlogUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [pressroomId] = getPathSegments(parsedUrl)

  if (!pressroomId) {
    return
  }

  return { kind: 'pressroom', pressroomId }
}

// The pressroom id answers in any case, and the page's feed alternate spells it as registered,
// so `/door_renew/` links `/Door_Renew/latest.xml`.
const getPressroomId = (url: string, content: string | undefined): string | undefined => {
  const parsed = parsePrlogUrl(url)

  if (!parsed) {
    return
  }

  const link = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'alternate' &&
      element.attribs.type === 'application/rss+xml'
    )
  })
  const linked = parsePrlogUrl(link?.attribs.href ?? '')

  if (linked && linked.pressroomId.toLowerCase() === parsed.pressroomId.toLowerCase()) {
    return linked.pressroomId
  }

  return parsed.pressroomId
}

export const prlogHandler: PlatformHandler = {
  match: (url) => {
    return parsePrlogUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const pressroomId = getPressroomId(url, content)

    if (!pressroomId) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `${origin}/${pressroomId}/latest.xml`,
      hint: composeHint('prlog:press-releases'),
    })

    return uris
  },
}
