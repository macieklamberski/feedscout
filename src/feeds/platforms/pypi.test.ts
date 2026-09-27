import { describe, expect, it } from 'bun:test'
import { pypiHandler } from './pypi.js'

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
    it('should return the releases feed for a project page', () => {
      const value = 'https://pypi.org/project/example-package/'
      const expected = [
        {
          uri: 'https://pypi.org/rss/project/example-package/releases.xml',
          hint: { key: 'pypi:releases', label: 'Releases' },
        },
      ]

      expect(pypiHandler.resolve(value)).toEqual(expected)
    })

    it('should return the releases feed for a project version page', () => {
      const value = 'https://pypi.org/project/example-package/1.0.0/'
      const expected = [
        {
          uri: 'https://pypi.org/rss/project/example-package/releases.xml',
          hint: { key: 'pypi:releases', label: 'Releases' },
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

    it('should return an empty array for the search page', () => {
      expect(pypiHandler.resolve('https://pypi.org/search/?q=example')).toEqual([])
    })
  })
})
