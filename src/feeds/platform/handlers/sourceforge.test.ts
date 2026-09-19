import { describe, expect, it } from 'bun:test'
import { sourceforgeHandler } from './sourceforge.js'

describe('sourceforgeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://sourceforge.net/projects/filezilla'],
      [true, 'https://www.sourceforge.net/projects/nmap'],
      [true, 'https://sourceforge.net/p/nmap/activity'],
      [true, 'https://sourceforge.net'],
      [false, 'https://github.com/user/repo'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(sourceforgeHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(sourceforgeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return all feeds for legacy project page', () => {
      const value = 'https://sourceforge.net/projects/filezilla'
      const expected = [
        {
          uri: 'https://sourceforge.net/p/filezilla/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed' },
        },
        {
          uri: 'https://sourceforge.net/projects/filezilla/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/news/feed.rss',
          hint: { key: 'sourceforge:news-rss', label: 'News (RSS)' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/news/feed.atom',
          hint: { key: 'sourceforge:news-atom', label: 'News (Atom)' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/discussion/feed',
          hint: { key: 'sourceforge:discussion', label: 'Discussion' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/discussion/feed.atom',
          hint: { key: 'sourceforge:discussion-atom', label: 'Discussion (Atom)' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/bugs/feed',
          hint: { key: 'sourceforge:bugs', label: 'Bugs' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return all feeds for project subpage', () => {
      const value = 'https://sourceforge.net/projects/filezilla/files'
      const expected = [
        {
          uri: 'https://sourceforge.net/p/filezilla/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed' },
        },
        {
          uri: 'https://sourceforge.net/projects/filezilla/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/news/feed.rss',
          hint: { key: 'sourceforge:news-rss', label: 'News (RSS)' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/news/feed.atom',
          hint: { key: 'sourceforge:news-atom', label: 'News (Atom)' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/discussion/feed',
          hint: { key: 'sourceforge:discussion', label: 'Discussion' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/discussion/feed.atom',
          hint: { key: 'sourceforge:discussion-atom', label: 'Discussion (Atom)' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/bugs/feed',
          hint: { key: 'sourceforge:bugs', label: 'Bugs' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return all feeds for /p/{project} URL', () => {
      const value = 'https://sourceforge.net/p/nmap/bugs/123'
      const expected = [
        {
          uri: 'https://sourceforge.net/p/nmap/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/p/nmap/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed' },
        },
        {
          uri: 'https://sourceforge.net/projects/nmap/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
        {
          uri: 'https://sourceforge.net/p/nmap/news/feed.rss',
          hint: { key: 'sourceforge:news-rss', label: 'News (RSS)' },
        },
        {
          uri: 'https://sourceforge.net/p/nmap/news/feed.atom',
          hint: { key: 'sourceforge:news-atom', label: 'News (Atom)' },
        },
        {
          uri: 'https://sourceforge.net/p/nmap/discussion/feed',
          hint: { key: 'sourceforge:discussion', label: 'Discussion' },
        },
        {
          uri: 'https://sourceforge.net/p/nmap/discussion/feed.atom',
          hint: { key: 'sourceforge:discussion-atom', label: 'Discussion (Atom)' },
        },
        {
          uri: 'https://sourceforge.net/p/nmap/bugs/feed',
          hint: { key: 'sourceforge:bugs', label: 'Bugs' },
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

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
