import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { SourceforgeUrl } from './sourceforge.js'
import { parseSourceforgeUrl, sourceforgeHandler } from './sourceforge.js'

describe('parseSourceforgeUrl', () => {
  it('should lowercase the project name', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'sevenzip' }

    expect(parseSourceforgeUrl('https://sourceforge.net/projects/SevenZip/')).toEqual(expected)
  })

  it('should return the project for /projects/{project}', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'filezilla' }

    expect(parseSourceforgeUrl('https://sourceforge.net/projects/filezilla')).toEqual(expected)
  })

  it('should return the project for /p/{project}', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap' }

    expect(parseSourceforgeUrl('https://sourceforge.net/p/nmap')).toEqual(expected)
  })

  it('should return the project for a capitalized /P/ prefix', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap' }

    expect(parseSourceforgeUrl('https://sourceforge.net/P/nmap')).toEqual(expected)
  })

  it('should return the project for a project subpage', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap' }

    expect(parseSourceforgeUrl('https://sourceforge.net/p/nmap/bugs/123')).toEqual(expected)
  })

  it('should return the project for a project name with hyphens', () => {
    const value = 'https://sourceforge.net/projects/my-cool-project'
    const expected: SourceforgeUrl = { kind: 'project', project: 'my-cool-project' }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the project for the www host', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap' }

    expect(parseSourceforgeUrl('https://www.sourceforge.net/projects/nmap')).toEqual(expected)
  })

  it('should return the project for an uppercase host', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap' }

    expect(parseSourceforgeUrl('https://SourceForge.net/projects/nmap')).toEqual(expected)
  })

  it('should return undefined for /projects/ without a project', () => {
    expect(parseSourceforgeUrl('https://sourceforge.net/projects/')).toBeUndefined()
  })

  it('should return undefined for /p without a project', () => {
    expect(parseSourceforgeUrl('https://sourceforge.net/p')).toBeUndefined()
  })

  it('should return undefined for a non-project path', () => {
    expect(parseSourceforgeUrl('https://sourceforge.net/directory')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseSourceforgeUrl('https://sourceforge.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSourceforgeUrl('https://example.com/projects/nmap')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseSourceforgeUrl('not-a-url')).toBeUndefined()
  })
})

describe('sourceforgeHandler', () => {
  describe('match', () => {
    it('should return true for a project page', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net/projects/filezilla')).toBe(true)
    })

    it('should return true for the homepage', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(sourceforgeHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return all feeds for a project page', () => {
      const value = 'https://sourceforge.net/projects/filezilla'
      const expected: Array<DiscoverUriEntry> = [
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
          hint: { key: 'sourceforge:news', label: 'News', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/news/feed.atom',
          hint: { key: 'sourceforge:news', label: 'News', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/discussion/feed',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/discussion/feed.atom',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/bugs/feed',
          hint: { key: 'sourceforge:bugs', label: 'Bugs' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root page', () => {
      const value = 'https://sourceforge.net'

      expect(sourceforgeHandler.resolve(value)).toEqual([])
    })
  })
})
