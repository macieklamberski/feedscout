import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type CratesIoUrl, cratesIoHandler, parseCratesIoUrl } from './cratesIo.js'

describe('parseCratesIoUrl', () => {
  it('should return the crate for a crate page', () => {
    const expected: CratesIoUrl = { kind: 'crate', crate: 'serde' }

    expect(parseCratesIoUrl('https://crates.io/crates/serde')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: CratesIoUrl = { kind: 'home' }

    expect(parseCratesIoUrl('https://crates.io/')).toEqual(expected)
  })

  it('should return undefined for another page', () => {
    expect(parseCratesIoUrl('https://crates.io/search?q=serde')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseCratesIoUrl('https://example.com/crates/serde')).toBeUndefined()
  })
})

describe('cratesIoHandler', () => {
  describe('match', () => {
    it('should match a crate page', () => {
      expect(cratesIoHandler.match('https://crates.io/crates/example-crate')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(cratesIoHandler.match('https://example.com/crates/example-crate')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(cratesIoHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the releases feed for a crate page', () => {
      const value = 'https://crates.io/crates/example_crate'
      const expected = [
        {
          uri: 'https://static.crates.io/rss/crates/example_crate.xml',
          hint: { key: 'crates-io:releases', label: 'Releases' },
        },
      ]

      expect(cratesIoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the releases feed for a crate version page', () => {
      const value = 'https://crates.io/crates/example-crate/1.0.0'
      const expected = [
        {
          uri: 'https://static.crates.io/rss/crates/example-crate.xml',
          hint: { key: 'crates-io:releases', label: 'Releases' },
        },
      ]

      expect(cratesIoHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of the crate name', () => {
      const value = 'https://crates.io/Crates/Example'
      const expected = [
        {
          uri: 'https://static.crates.io/rss/crates/Example.xml',
          hint: { key: 'crates-io:releases', label: 'Releases' },
        },
      ]

      expect(cratesIoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site-wide feeds for the home page', () => {
      const value = 'https://crates.io/'
      const expected = [
        {
          uri: 'https://static.crates.io/rss/crates.xml',
          hint: { key: 'crates-io:new-crates', label: 'New crates' },
        },
        {
          uri: 'https://static.crates.io/rss/updates.xml',
          hint: { key: 'crates-io:updates', label: 'Recent updates' },
        },
      ]

      expect(cratesIoHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the crate list', () => {
      expect(cratesIoHandler.resolve('https://crates.io/crates')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the releases hint for a crate releases feed', () => {
      const value = 'https://static.crates.io/rss/crates/highs.xml'
      const expected: DiscoverUriHint = { key: 'crates-io:releases', label: 'Releases' }

      expect(cratesIoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the releases hint for a crate name with a hyphen', () => {
      const value = 'https://static.crates.io/rss/crates/tokio-util.xml'
      const expected: DiscoverUriHint = { key: 'crates-io:releases', label: 'Releases' }

      expect(cratesIoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the releases hint for a crate name with an underscore', () => {
      const value = 'https://static.crates.io/rss/crates/serde_json.xml'
      const expected: DiscoverUriHint = { key: 'crates-io:releases', label: 'Releases' }

      expect(cratesIoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the new crates hint for the new crates feed', () => {
      const value = 'https://static.crates.io/rss/crates.xml'
      const expected: DiscoverUriHint = { key: 'crates-io:new-crates', label: 'New crates' }

      expect(cratesIoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the updates hint for the updates feed', () => {
      const value = 'https://static.crates.io/rss/updates.xml'
      const expected: DiscoverUriHint = { key: 'crates-io:updates', label: 'Recent updates' }

      expect(cratesIoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a crate page', () => {
      const value = 'https://crates.io/crates/highs'

      expect(cratesIoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the page host', () => {
      const value = 'https://crates.io/rss/crates/highs.xml'

      expect(cratesIoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/rss/crates/highs.xml'

      expect(cratesIoHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://static.crates.io/rss/crates/highs.xml',
        { key: 'crates-io:releases', label: 'Releases' },
      ],
      [
        'https://static.crates.io/rss/crates/ipinfo.xml',
        { key: 'crates-io:releases', label: 'Releases' },
      ],
      [
        'https://static.crates.io/rss/crates.xml',
        { key: 'crates-io:new-crates', label: 'New crates' },
      ],
      [
        'https://static.crates.io/rss/updates.xml',
        { key: 'crates-io:updates', label: 'Recent updates' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [cratesIoHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
