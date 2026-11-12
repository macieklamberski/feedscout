import { isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds, type PlatformFeedParams } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers extensions, home, package, vendor.

export type PackagistUrl =
  | { kind: 'package'; vendor: string; name: string }
  | { kind: 'vendor'; vendor: string }
  | { kind: 'extensions' }
  | { kind: 'home' }

const hosts = ['packagist.org']

const packageRegex = /^\/packages\/([^/]+)\/([^/]+)(?:\/|$)/i
const vendorRegex = /^\/packages\/([^/]+)\/?$/i
const extensionsRegex = /^\/extensions(?:\/|$)/i

// The JSON API sits under the same paths, such as /packages/list.json.
const jsonSuffixRegex = /\.json$/i

const feeds = definePlatformFeeds([
  {
    key: 'packagist:releases',
    template: 'https://packagist.org/feeds/package.{vendor}/{name}.rss',
    format: 'rss',
  },
  {
    key: 'packagist:releases',
    template: 'https://packagist.org/feeds/package.{vendor}/{name}.atom',
    format: 'atom',
  },
  {
    key: 'packagist:vendor',
    template: 'https://packagist.org/feeds/vendor.{vendor}.rss',
    format: 'rss',
  },
  {
    key: 'packagist:vendor',
    template: 'https://packagist.org/feeds/vendor.{vendor}.atom',
    format: 'atom',
  },
  {
    key: 'packagist:new-packages',
    template: 'https://packagist.org/feeds/packages.rss',
    format: 'rss',
  },
  {
    key: 'packagist:new-packages',
    template: 'https://packagist.org/feeds/packages.atom',
    format: 'atom',
  },
  {
    key: 'packagist:new-releases',
    template: 'https://packagist.org/feeds/releases.rss',
    format: 'rss',
  },
  {
    key: 'packagist:new-releases',
    template: 'https://packagist.org/feeds/releases.atom',
    format: 'atom',
  },
  {
    key: 'packagist:new-extensions',
    template: 'https://packagist.org/feeds/extensions.rss',
    format: 'rss',
  },
  {
    key: 'packagist:new-extensions',
    template: 'https://packagist.org/feeds/extensions.atom',
    format: 'atom',
  },
  {
    key: 'packagist:extension-releases',
    template: 'https://packagist.org/feeds/extension-releases.rss',
    format: 'rss',
  },
  {
    key: 'packagist:extension-releases',
    template: 'https://packagist.org/feeds/extension-releases.atom',
    format: 'atom',
  },
])

const getFeedEntries = (key: string, params?: PlatformFeedParams): Array<DiscoverUriEntry> => {
  return [feeds.getFeedEntry(key, params, 'rss'), feeds.getFeedEntry(key, params, 'atom')]
}

export const parsePackagistUrl = (url: string): PackagistUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl

  if (jsonSuffixRegex.test(pathname)) {
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
    const siteFeeds = [
      ...getFeedEntries('packagist:new-packages'),
      ...getFeedEntries('packagist:new-releases'),
    ]

    if (parsed.kind === 'package') {
      return [
        ...getFeedEntries('packagist:releases', { vendor: parsed.vendor, name: parsed.name }),
        ...siteFeeds,
      ]
    }

    if (parsed.kind === 'vendor') {
      return [...getFeedEntries('packagist:vendor', { vendor: parsed.vendor }), ...siteFeeds]
    }

    if (parsed.kind === 'extensions') {
      return [
        ...getFeedEntries('packagist:new-extensions'),
        ...getFeedEntries('packagist:extension-releases'),
        ...siteFeeds,
      ]
    }

    return siteFeeds
  },

  getFeedHint: feeds.getFeedHint,
}
