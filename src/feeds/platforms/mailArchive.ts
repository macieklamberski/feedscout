import { decodeSegment, encodePathSegment, getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers list (html).
// Handler needed for: message.

export type MailArchiveUrl = { kind: 'list'; list: string }

const hosts = ['mail-archive.com', 'www.mail-archive.com']

export const parseMailArchiveUrl = (url: string): MailArchiveUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const list = getPathSegments(url)[0]

  // A list is archived under its posting address, so the site's own pages carry no `@`. The address
  // stays as written, so a feed stored as `%40` keeps that spelling.
  if (!list || !decodeSegment(list)?.includes('@')) {
    return
  }

  return { kind: 'list', list }
}

export const mailArchiveHandler: PlatformHandler = {
  match: (url) => {
    return parseMailArchiveUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMailArchiveUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const list = encodePathSegment(parsed.list)

    return [
      {
        uri: `${origin}/${list}/maillist.xml`,
        hint: composeHint('mail-archive:list'),
      },
    ]
  },
}
