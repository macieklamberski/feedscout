import { getSubdomain, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CanalblogUrl = { kind: 'blog' }

const domains = ['canalblog.com']

// Service hosts resolve off the blog farm.
const excludedHosts = [
  'admin.canalblog.com',
  'api.canalblog.com',
  'assets.canalblog.com',
  'connect.canalblog.com',
  'data.canalblog.com',
  'forum.canalblog.com',
  'image.canalblog.com',
  'img.canalblog.com',
  'mail.canalblog.com',
  'premium.canalblog.com',
  'profilepics.canalblog.com',
  'static.canalblog.com',
  'storage.canalblog.com',
  'upload.canalblog.com',
  'www.canalblog.com',
]

export const parseCanalblogUrl = (url: string): CanalblogUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  // A nested subdomain like a.b.canalblog.com fails TLS, since the certificate covers one label.
  if (!subdomain || subdomain.includes('.')) {
    return
  }

  if (isHostOf(url, excludedHosts)) {
    return
  }

  return { kind: 'blog' }
}

export const canalblogHandler: PlatformHandler = {
  match: (url) => {
    return parseCanalblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCanalblogUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss`, hint: composeHint('canalblog:posts') }]
  },
}
