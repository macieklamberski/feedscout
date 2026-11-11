import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PackagistUrl, packagistHandler, parsePackagistUrl } from './packagist.js'

describe('parsePackagistUrl', () => {
  it('should return undefined for the JSON API', () => {
    expect(parsePackagistUrl('https://packagist.org/packages/list.json')).toBeUndefined()
    expect(parsePackagistUrl('https://packagist.org/packages/monolog/monolog.json')).toBeUndefined()
  })

  it('should return the package for a package page', () => {
    const expected: PackagistUrl = { kind: 'package', vendor: 'acme', name: 'logger' }

    expect(parsePackagistUrl('https://packagist.org/packages/acme/logger')).toEqual(expected)
  })

  it('should return the vendor for a vendor page', () => {
    const expected: PackagistUrl = { kind: 'vendor', vendor: 'acme' }

    expect(parsePackagistUrl('https://packagist.org/packages/acme')).toEqual(expected)
  })

  it('should return the extensions page', () => {
    const expected: PackagistUrl = { kind: 'extensions' }

    expect(parsePackagistUrl('https://packagist.org/extensions')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: PackagistUrl = { kind: 'home' }

    expect(parsePackagistUrl('https://packagist.org/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parsePackagistUrl('https://example.com/packages/acme/logger')).toBeUndefined()
  })
})

describe('packagistHandler', () => {
  describe('match', () => {
    it('should match a package page', () => {
      expect(packagistHandler.match('https://packagist.org/packages/acme/logger')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(packagistHandler.match('https://example.com/packages/acme/logger')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Packagist', () => {
      expect(packagistHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the releases and site-wide feeds for a package page', () => {
      const value = 'https://packagist.org/packages/acme/logger'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://packagist.org/feeds/package.acme/logger.rss',
          hint: { key: 'packagist:releases', label: 'Releases', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/package.acme/logger.atom',
          hint: { key: 'packagist:releases', label: 'Releases', format: 'atom' },
        },
        {
          uri: 'https://packagist.org/feeds/packages.rss',
          hint: { key: 'packagist:new-packages', label: 'New packages', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/packages.atom',
          hint: { key: 'packagist:new-packages', label: 'New packages', format: 'atom' },
        },
        {
          uri: 'https://packagist.org/feeds/releases.rss',
          hint: { key: 'packagist:new-releases', label: 'New releases', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/releases.atom',
          hint: { key: 'packagist:new-releases', label: 'New releases', format: 'atom' },
        },
      ]

      expect(packagistHandler.resolve(value)).toEqual(expected)
    })

    it('should return the releases and site-wide feeds for a package subpage', () => {
      const value = 'https://packagist.org/packages/acme/logger/stats'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://packagist.org/feeds/package.acme/logger.rss',
          hint: { key: 'packagist:releases', label: 'Releases', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/package.acme/logger.atom',
          hint: { key: 'packagist:releases', label: 'Releases', format: 'atom' },
        },
        {
          uri: 'https://packagist.org/feeds/packages.rss',
          hint: { key: 'packagist:new-packages', label: 'New packages', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/packages.atom',
          hint: { key: 'packagist:new-packages', label: 'New packages', format: 'atom' },
        },
        {
          uri: 'https://packagist.org/feeds/releases.rss',
          hint: { key: 'packagist:new-releases', label: 'New releases', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/releases.atom',
          hint: { key: 'packagist:new-releases', label: 'New releases', format: 'atom' },
        },
      ]

      expect(packagistHandler.resolve(value)).toEqual(expected)
    })

    it('should return the vendor and site-wide feeds for a vendor page', () => {
      const value = 'https://packagist.org/packages/acme/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://packagist.org/feeds/vendor.acme.rss',
          hint: { key: 'packagist:vendor', label: 'Vendor releases', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/vendor.acme.atom',
          hint: { key: 'packagist:vendor', label: 'Vendor releases', format: 'atom' },
        },
        {
          uri: 'https://packagist.org/feeds/packages.rss',
          hint: { key: 'packagist:new-packages', label: 'New packages', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/packages.atom',
          hint: { key: 'packagist:new-packages', label: 'New packages', format: 'atom' },
        },
        {
          uri: 'https://packagist.org/feeds/releases.rss',
          hint: { key: 'packagist:new-releases', label: 'New releases', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/releases.atom',
          hint: { key: 'packagist:new-releases', label: 'New releases', format: 'atom' },
        },
      ]

      expect(packagistHandler.resolve(value)).toEqual(expected)
    })

    it('should return the extension and site-wide feeds for the extensions page', () => {
      const value = 'https://packagist.org/extensions'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://packagist.org/feeds/extensions.rss',
          hint: { key: 'packagist:new-extensions', label: 'New extensions', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/extensions.atom',
          hint: { key: 'packagist:new-extensions', label: 'New extensions', format: 'atom' },
        },
        {
          uri: 'https://packagist.org/feeds/extension-releases.rss',
          hint: {
            key: 'packagist:extension-releases',
            label: 'Extension releases',
            format: 'rss',
          },
        },
        {
          uri: 'https://packagist.org/feeds/extension-releases.atom',
          hint: {
            key: 'packagist:extension-releases',
            label: 'Extension releases',
            format: 'atom',
          },
        },
        {
          uri: 'https://packagist.org/feeds/packages.rss',
          hint: { key: 'packagist:new-packages', label: 'New packages', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/packages.atom',
          hint: { key: 'packagist:new-packages', label: 'New packages', format: 'atom' },
        },
        {
          uri: 'https://packagist.org/feeds/releases.rss',
          hint: { key: 'packagist:new-releases', label: 'New releases', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/releases.atom',
          hint: { key: 'packagist:new-releases', label: 'New releases', format: 'atom' },
        },
      ]

      expect(packagistHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site-wide feeds for the home page', () => {
      const value = 'https://packagist.org/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://packagist.org/feeds/packages.rss',
          hint: { key: 'packagist:new-packages', label: 'New packages', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/packages.atom',
          hint: { key: 'packagist:new-packages', label: 'New packages', format: 'atom' },
        },
        {
          uri: 'https://packagist.org/feeds/releases.rss',
          hint: { key: 'packagist:new-releases', label: 'New releases', format: 'rss' },
        },
        {
          uri: 'https://packagist.org/feeds/releases.atom',
          hint: { key: 'packagist:new-releases', label: 'New releases', format: 'atom' },
        },
      ]

      expect(packagistHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the releases key for an RSS package feed', () => {
      const value = 'https://packagist.org/feeds/package.colorcube/rte-proc-tester.rss'
      const expected = 'packagist:releases'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the releases key for an Atom package feed', () => {
      const value = 'https://packagist.org/feeds/package.colorcube/rte-proc-tester.atom'
      const expected = 'packagist:releases'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the releases key for a package feed whose vendor has a dot', () => {
      const value = 'https://packagist.org/feeds/package.datatables.net/datatables.net-bs5.rss'
      const expected = 'packagist:releases'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the releases key for a package feed whose name has a dot', () => {
      const value = 'https://packagist.org/feeds/package.51degrees/fiftyone.devicedetection.atom'
      const expected = 'packagist:releases'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the vendor key for an RSS vendor feed', () => {
      const value = 'https://packagist.org/feeds/vendor.gladyshev.rss'
      const expected = 'packagist:vendor'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the vendor key for an Atom vendor feed', () => {
      const value = 'https://packagist.org/feeds/vendor.gladyshev.atom'
      const expected = 'packagist:vendor'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the vendor key for a vendor feed whose vendor has a dot', () => {
      const value = 'https://packagist.org/feeds/vendor.datatables.net.rss'
      const expected = 'packagist:vendor'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the vendor key for a vendor named after a site-wide feed', () => {
      const value = 'https://packagist.org/feeds/vendor.packages.rss'
      const expected = 'packagist:vendor'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the new packages key for the new packages feed', () => {
      const value = 'https://packagist.org/feeds/packages.rss'
      const expected = 'packagist:new-packages'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the new releases key for the new releases feed', () => {
      const value = 'https://packagist.org/feeds/releases.atom'
      const expected = 'packagist:new-releases'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the new extensions key for the new extensions feed', () => {
      const value = 'https://packagist.org/feeds/extensions.rss'
      const expected = 'packagist:new-extensions'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the extension releases key for the extension releases feed', () => {
      const value = 'https://packagist.org/feeds/extension-releases.atom'
      const expected = 'packagist:extension-releases'

      expect(packagistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a package page', () => {
      const value = 'https://packagist.org/packages/colorcube/rte-proc-tester'

      expect(packagistHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a package feed without its format', () => {
      const value = 'https://packagist.org/feeds/package.colorcube/rte-proc-tester'

      expect(packagistHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the JSON API', () => {
      const value = 'https://packagist.org/packages/list.json'

      expect(packagistHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/feeds/packages.rss'

      expect(packagistHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://packagist.org/feeds/package.colorcube/rte-proc-tester.rss',
        { key: 'packagist:releases', label: 'Releases' },
      ],
      [
        'https://packagist.org/feeds/package.colorcube/rte-proc-tester.atom',
        { key: 'packagist:releases', label: 'Releases' },
      ],
      [
        'https://packagist.org/feeds/vendor.gladyshev.rss',
        { key: 'packagist:vendor', label: 'Vendor releases' },
      ],
      [
        'https://packagist.org/feeds/vendor.gladyshev.atom',
        { key: 'packagist:vendor', label: 'Vendor releases' },
      ],
      [
        'https://packagist.org/feeds/packages.rss',
        { key: 'packagist:new-packages', label: 'New packages' },
      ],
      [
        'https://packagist.org/feeds/packages.atom',
        { key: 'packagist:new-packages', label: 'New packages' },
      ],
      [
        'https://packagist.org/feeds/releases.rss',
        { key: 'packagist:new-releases', label: 'New releases' },
      ],
      [
        'https://packagist.org/feeds/releases.atom',
        { key: 'packagist:new-releases', label: 'New releases' },
      ],
      [
        'https://packagist.org/feeds/extensions.rss',
        { key: 'packagist:new-extensions', label: 'New extensions' },
      ],
      [
        'https://packagist.org/feeds/extensions.atom',
        { key: 'packagist:new-extensions', label: 'New extensions' },
      ],
      [
        'https://packagist.org/feeds/extension-releases.rss',
        { key: 'packagist:extension-releases', label: 'Extension releases' },
      ],
      [
        'https://packagist.org/feeds/extension-releases.atom',
        { key: 'packagist:extension-releases', label: 'Extension releases' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [packagistHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
