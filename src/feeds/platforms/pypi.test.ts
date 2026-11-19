import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PypiUrl, parsePypiUrl, pypiHandler } from './pypi.js'

describe('parsePypiUrl', () => {
  it('should return the project for a project page', () => {
    const expected: PypiUrl = { kind: 'project', project: 'example-package' }

    expect(parsePypiUrl('https://pypi.org/project/example-package/')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: PypiUrl = { kind: 'home' }

    expect(parsePypiUrl('https://pypi.org/')).toEqual(expected)
  })

  it('should read another page as the home page', () => {
    const expected: PypiUrl = { kind: 'home' }

    expect(parsePypiUrl('https://pypi.org/help/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parsePypiUrl('https://example.com/project/example-package/')).toBeUndefined()
  })
})

describe('pypiHandler', () => {
  describe('match', () => {
    it('should match a project page', () => {
      expect(pypiHandler.match('https://pypi.org/project/example-package/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(pypiHandler.match('https://example.com/project/example-package/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the releases and site-wide feeds for a project page', () => {
      const value = 'https://pypi.org/project/example-package/'
      const expected = [
        {
          uri: 'https://pypi.org/rss/project/example-package/releases.xml',
          hint: { key: 'pypi:releases', label: 'Releases' },
        },
        {
          uri: 'https://pypi.org/rss/packages.xml',
          hint: { key: 'pypi:new-packages', label: 'New packages' },
        },
        {
          uri: 'https://pypi.org/rss/updates.xml',
          hint: { key: 'pypi:updates', label: 'Recent updates' },
        },
      ]

      expect(pypiHandler.resolve(value)).toEqual(expected)
    })

    it('should return the releases and site-wide feeds for a project version page', () => {
      const value = 'https://pypi.org/project/example-package/1.0.0/'
      const expected = [
        {
          uri: 'https://pypi.org/rss/project/example-package/releases.xml',
          hint: { key: 'pypi:releases', label: 'Releases' },
        },
        {
          uri: 'https://pypi.org/rss/packages.xml',
          hint: { key: 'pypi:new-packages', label: 'New packages' },
        },
        {
          uri: 'https://pypi.org/rss/updates.xml',
          hint: { key: 'pypi:updates', label: 'Recent updates' },
        },
      ]

      expect(pypiHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case and separators of the project name', () => {
      const value = 'https://www.pypi.org/Project/Example_Package.Core'
      const expected = [
        {
          uri: 'https://pypi.org/rss/project/Example_Package.Core/releases.xml',
          hint: { key: 'pypi:releases', label: 'Releases' },
        },
        {
          uri: 'https://pypi.org/rss/packages.xml',
          hint: { key: 'pypi:new-packages', label: 'New packages' },
        },
        {
          uri: 'https://pypi.org/rss/updates.xml',
          hint: { key: 'pypi:updates', label: 'Recent updates' },
        },
      ]

      expect(pypiHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site-wide feeds for the home page', () => {
      const value = 'https://pypi.org/'
      const expected = [
        {
          uri: 'https://pypi.org/rss/packages.xml',
          hint: { key: 'pypi:new-packages', label: 'New packages' },
        },
        {
          uri: 'https://pypi.org/rss/updates.xml',
          hint: { key: 'pypi:updates', label: 'Recent updates' },
        },
      ]

      expect(pypiHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the releases hint for a project releases feed', () => {
      const value = 'https://pypi.org/rss/project/md5util/releases.xml'
      const expected: DiscoverUriHint = { key: 'pypi:releases', label: 'Releases' }

      expect(pypiHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a project releases feed as itself', async () => {
      const value = 'https://pypi.org/rss/project/md5util/releases.xml'
      const hint: DiscoverUriHint = { key: 'pypi:releases', label: 'Releases' }
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [pypiHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
