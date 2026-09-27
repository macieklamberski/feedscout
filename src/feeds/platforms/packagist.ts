import { isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers extensions, home, package, vendor.

const hosts = ['packagist.org']

const packageRegex = /^\/packages\/([^/]+)\/([^/]+)(?:\/|$)/i
const vendorRegex = /^\/packages\/([^/]+)\/?$/i
const extensionsRegex = /^\/extensions(?:\/|$)/i

const excludedVendors = ['submit']

const createFeeds = (name: string, key: string): Array<DiscoverUriEntry> => {
  return [
    { uri: `https://packagist.org/feeds/${name}.rss`, hint: composeHint(key, 'rss') },
    { uri: `https://packagist.org/feeds/${name}.atom`, hint: composeHint(key, 'atom') },
  ]
}

export const packagistHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const packageMatch = pathname.match(packageRegex)

    if (packageMatch) {
      return createFeeds(`package.${packageMatch[1]}/${packageMatch[2]}`, 'packagist:releases')
    }

    const vendor = pathname.match(vendorRegex)?.[1]

    if (vendor && !isAnyOf(vendor, excludedVendors)) {
      return createFeeds(`vendor.${vendor}`, 'packagist:vendor')
    }

    if (extensionsRegex.test(pathname)) {
      return [
        ...createFeeds('extensions', 'packagist:new-extensions'),
        ...createFeeds('extension-releases', 'packagist:extension-releases'),
      ]
    }

    // Every other page, the home page included, advertises the two site-wide feeds.
    return [
      ...createFeeds('packages', 'packagist:new-packages'),
      ...createFeeds('releases', 'packagist:new-releases'),
    ]
  },
}
