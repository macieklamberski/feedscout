import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

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

const excludedPaths = ['submit']

const createFeeds = (name: string, key: string): Array<DiscoverUriEntry> => {
  return [
    { uri: `https://packagist.org/feeds/${name}.rss`, hint: composeHint(key, 'rss') },
    { uri: `https://packagist.org/feeds/${name}.atom`, hint: composeHint(key, 'atom') },
  ]
}

export const parsePackagistUrl = (url: string): PackagistUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const packageMatch = pathname.match(packageRegex)

  if (packageMatch) {
    return { kind: 'package', vendor: packageMatch[1], name: packageMatch[2] }
  }

  const vendor = pathname.match(vendorRegex)?.[1]

  if (vendor && !isAnyOf(vendor, excludedPaths)) {
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

    if (parsed.kind === 'package') {
      return createFeeds(`package.${parsed.vendor}/${parsed.name}`, 'packagist:releases')
    }

    if (parsed.kind === 'vendor') {
      return createFeeds(`vendor.${parsed.vendor}`, 'packagist:vendor')
    }

    if (parsed.kind === 'extensions') {
      return [
        ...createFeeds('extensions', 'packagist:new-extensions'),
        ...createFeeds('extension-releases', 'packagist:extension-releases'),
      ]
    }

    return [
      ...createFeeds('packages', 'packagist:new-packages'),
      ...createFeeds('releases', 'packagist:new-releases'),
    ]
  },
}
