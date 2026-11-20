import { packagist } from 'feedintel'
import { endsWithAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: extension-releases, new-extensions, releases, vendor.
// Handler needed for: new-packages, new-releases.

export type PackagistUrl =
  | { kind: 'package'; vendor: string; name: string }
  | { kind: 'vendor'; vendor: string }
  | { kind: 'extensions' }
  | { kind: 'home' }

const hosts = packagist.hosts.exact

const packageRegex = /^\/packages\/([^/]+)\/([^/]+)(?:\/|$)/i
const vendorRegex = /^\/packages\/([^/]+)\/?$/i
const extensionsRegex = /^\/extensions(?:\/|$)/i

const feeds = withHintLabels(packagist.feeds)

export const parsePackagistUrl = (url: string): PackagistUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl

  // The JSON API sits under the same paths, such as /packages/list.json.
  if (endsWithAnyOf(pathname, '.json')) {
    return
  }

  const packageMatch = pathname.match(packageRegex)

  if (packageMatch) {
    return { kind: 'package', vendor: packageMatch[1], name: packageMatch[2] }
  }

  const vendor = pathname.match(vendorRegex)?.[1]

  if (vendor) {
    return { kind: 'vendor', vendor }
  }

  if (extensionsRegex.test(pathname)) {
    return { kind: 'extensions' }
  }

  // Every other page, the home page included, advertises the two site-wide feeds.
  return { kind: 'home' }
}

export const packagistHandler: PlatformHandler = {
  match: (url) => {
    return parsePackagistUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePackagistUrl(url)

    if (!parsed) {
      return []
    }

    // Every page gets the site-wide feeds after its own, the extension pages included, which do
    // not link them.
    if (parsed.kind === 'package') {
      const params = { vendor: parsed.vendor, name: parsed.name }

      return [
        feeds.getFeedEntry('releases', params, 'rss'),
        feeds.getFeedEntry('releases', params, 'atom'),
        feeds.getFeedEntry('new-packages', undefined, 'rss'),
        feeds.getFeedEntry('new-packages', undefined, 'atom'),
        feeds.getFeedEntry('new-releases', undefined, 'rss'),
        feeds.getFeedEntry('new-releases', undefined, 'atom'),
      ]
    }

    if (parsed.kind === 'vendor') {
      return [
        feeds.getFeedEntry('vendor', { vendor: parsed.vendor }, 'rss'),
        feeds.getFeedEntry('vendor', { vendor: parsed.vendor }, 'atom'),
        feeds.getFeedEntry('new-packages', undefined, 'rss'),
        feeds.getFeedEntry('new-packages', undefined, 'atom'),
        feeds.getFeedEntry('new-releases', undefined, 'rss'),
        feeds.getFeedEntry('new-releases', undefined, 'atom'),
      ]
    }

    if (parsed.kind === 'extensions') {
      return [
        feeds.getFeedEntry('new-extensions', undefined, 'rss'),
        feeds.getFeedEntry('new-extensions', undefined, 'atom'),
        feeds.getFeedEntry('extension-releases', undefined, 'rss'),
        feeds.getFeedEntry('extension-releases', undefined, 'atom'),
        feeds.getFeedEntry('new-packages', undefined, 'rss'),
        feeds.getFeedEntry('new-packages', undefined, 'atom'),
        feeds.getFeedEntry('new-releases', undefined, 'rss'),
        feeds.getFeedEntry('new-releases', undefined, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('new-packages', undefined, 'rss'),
      feeds.getFeedEntry('new-packages', undefined, 'atom'),
      feeds.getFeedEntry('new-releases', undefined, 'rss'),
      feeds.getFeedEntry('new-releases', undefined, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
