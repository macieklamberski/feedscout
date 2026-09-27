import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { packagistHandler } from './packagist.js'

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
    it('should return the releases feeds for a package page', () => {
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
      ]

      expect(packagistHandler.resolve(value)).toEqual(expected)
    })

    it('should return the releases feeds for a package subpage', () => {
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
      ]

      expect(packagistHandler.resolve(value)).toEqual(expected)
    })

    it('should return the vendor feeds for a vendor page', () => {
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
      ]

      expect(packagistHandler.resolve(value)).toEqual(expected)
    })

    it('should return the extension feeds for the extensions page', () => {
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

    it('should return the site-wide feeds for the submit page', () => {
      const value = 'https://packagist.org/packages/submit'
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
})
