import { describe, expect, it } from 'bun:test'
import { sourceforgeHandler } from './sourceforge.js'

describe('sourceforgeHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://sourceforge.net/projects/filezilla', true],
      ['https://www.sourceforge.net/projects/nmap', true],
      ['https://sourceforge.net/p/nmap/activity', true],
      ['https://sourceforge.net', true],
      ['https://github.com/user/repo', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(sourceforgeHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(sourceforgeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return activity and files feeds for legacy project page', () => {
      const value = 'https://sourceforge.net/projects/filezilla'
      const expected = [
        {
          uri: 'https://sourceforge.net/p/filezilla/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/projects/filezilla/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return activity and files feeds for project subpage', () => {
      const value = 'https://sourceforge.net/projects/filezilla/files'
      const expected = [
        {
          uri: 'https://sourceforge.net/p/filezilla/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/projects/filezilla/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return activity and files feeds for /p/{project} URL', () => {
      const value = 'https://sourceforge.net/p/nmap/bugs/123'
      const expected = [
        {
          uri: 'https://sourceforge.net/p/nmap/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/projects/nmap/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root page', () => {
      const value = 'https://sourceforge.net'

      expect(sourceforgeHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for non-project paths', () => {
      const values = [
        'https://sourceforge.net/directory',
        'https://sourceforge.net/support',
        'https://sourceforge.net/about',
      ]

      for (const value of values) {
        expect(sourceforgeHandler.resolve(value)).toEqual([])
      }
    })

    it('should return empty array for projects path without project name', () => {
      const value = 'https://sourceforge.net/projects'

      expect(sourceforgeHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for /p path without project name', () => {
      const value = 'https://sourceforge.net/p'

      expect(sourceforgeHandler.resolve(value)).toEqual([])
    })
  })
})
