import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseRubygemsUrl, type RubygemsUrl, rubygemsHandler } from './rubygems.js'

describe('parseRubygemsUrl', () => {
  it('should return the gem for a gem page', () => {
    const expected: RubygemsUrl = { kind: 'gem', gem: 'RedCloth' }

    expect(parseRubygemsUrl('https://rubygems.org/gems/RedCloth')).toEqual(expected)
  })

  it('should return the home page for any other page', () => {
    const expected: RubygemsUrl = { kind: 'home' }

    expect(parseRubygemsUrl('https://rubygems.org/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseRubygemsUrl('https://example.com/gems/example')).toBeUndefined()
  })
})

describe('rubygemsHandler', () => {
  describe('match', () => {
    it('should match a gem page', () => {
      expect(rubygemsHandler.match('https://rubygems.org/gems/example')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(rubygemsHandler.match('https://example.com/gems/example')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside RubyGems', () => {
      expect(rubygemsHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the versions feed for a gem page', () => {
      const value = 'https://rubygems.org/gems/example-gem'
      const expected = [
        {
          uri: 'https://rubygems.org/gems/example-gem/versions.atom',
          hint: { key: 'rubygems:versions', label: 'Versions' },
        },
      ]

      expect(rubygemsHandler.resolve(value)).toEqual(expected)
    })

    it('should return the versions feed for a gem version page', () => {
      const value = 'https://rubygems.org/gems/example_gem/versions/1.0.0'
      const expected = [
        {
          uri: 'https://rubygems.org/gems/example_gem/versions.atom',
          hint: { key: 'rubygems:versions', label: 'Versions' },
        },
      ]

      expect(rubygemsHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of the gem name', () => {
      const value = 'https://rubygems.org/Gems/ExampleGem'
      const expected = [
        {
          uri: 'https://rubygems.org/gems/ExampleGem/versions.atom',
          hint: { key: 'rubygems:versions', label: 'Versions' },
        },
      ]

      expect(rubygemsHandler.resolve(value)).toEqual(expected)
    })

    it('should return the latest gems feed for the home page', () => {
      const value = 'https://rubygems.org/'
      const expected = [
        {
          uri: 'https://rubygems.org/gems.atom',
          hint: { key: 'rubygems:latest-gems', label: 'Latest gems' },
        },
      ]

      expect(rubygemsHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const versionsFeeds: Array<string> = [
      'https://rubygems.org/gems/example/versions.atom',
      'http://rubygems.org/gems/example/versions.atom',
      'https://www.rubygems.org/gems/example/versions.atom',
      'https://rubygems.org/gems/example/versions.atom/',
      'https://rubygems.org/gems/Example_Gem/versions.atom',
      'https://index.rubygems.org/gems/example/versions.atom',
      'https://bundler.rubygems.org/gems/example/versions.atom',
    ]

    it.each(versionsFeeds)('should return the versions hint for %s', (value) => {
      const expected: DiscoverUriHint = { key: 'rubygems:versions', label: 'Versions' }

      expect(rubygemsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    const latestGemsFeeds: Array<string> = [
      'https://rubygems.org/gems.atom',
      'http://rubygems.org/gems.atom',
      'https://www.rubygems.org/gems.atom',
      'https://rubygems.org/gems.atom/',
      'https://index.rubygems.org/gems.atom',
      'https://bundler.rubygems.org/gems.atom',
    ]

    it.each(latestGemsFeeds)('should return the latest gems hint for %s', (value) => {
      const expected: DiscoverUriHint = { key: 'rubygems:latest-gems', label: 'Latest gems' }

      expect(rubygemsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    const pages: Array<string> = [
      'https://rubygems.org/',
      'https://rubygems.org/gems',
      'https://rubygems.org/gems/example',
      'https://rubygems.org/gems/example/versions',
      'https://rubygems.org/gems/example/versions/1.0.0',
      'https://index.rubygems.org/gems/example',
    ]

    it.each(pages)('should return undefined for the page %s', (value) => {
      expect(rubygemsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another RubyGems host', () => {
      const value = 'https://blog.rubygems.org/gems/example/versions.atom'

      expect(rubygemsHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const versionsFeeds: Array<string> = [
      'https://rubygems.org/gems/example/versions.atom',
      'http://rubygems.org/gems/example/versions.atom',
      'https://index.rubygems.org/gems/example/versions.atom',
      'https://bundler.rubygems.org/gems/example/versions.atom',
    ]

    it.each(versionsFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [rubygemsHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'rubygems:versions', label: 'Versions' } },
      ]

      expect(result).toEqual(expected)
    })

    const latestGemsFeeds: Array<string> = [
      'https://rubygems.org/gems.atom',
      'https://www.rubygems.org/gems.atom',
      'https://index.rubygems.org/gems.atom',
      'https://bundler.rubygems.org/gems.atom',
    ]

    it.each(latestGemsFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [rubygemsHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'rubygems:latest-gems', label: 'Latest gems' } },
      ]

      expect(result).toEqual(expected)
    })
  })
})
