import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { SourceforgeUrl } from './sourceforge.js'
import { parseSourceforgeUrl, sourceforgeHandler } from './sourceforge.js'

describe('parseSourceforgeUrl', () => {
  it('should keep the project name case', () => {
    const expected: SourceforgeUrl = { kind: 'project', project: 'SevenZip' }

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

    it('should return false for the homepage', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net')).toBe(false)
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

    it('should return https feeds for an http page', () => {
      const value = 'http://sourceforge.net/projects/hsqldb'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sourceforge.net/p/hsqldb/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed' },
        },
        {
          uri: 'https://sourceforge.net/projects/hsqldb/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/news/feed.rss',
          hint: { key: 'sourceforge:news', label: 'News', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/news/feed.atom',
          hint: { key: 'sourceforge:news', label: 'News', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/discussion/feed',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/discussion/feed.atom',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/bugs/feed',
          hint: { key: 'sourceforge:bugs', label: 'Bugs' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return apex feeds for a www page', () => {
      const value = 'https://www.sourceforge.net/p/hsqldb'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sourceforge.net/p/hsqldb/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed' },
        },
        {
          uri: 'https://sourceforge.net/projects/hsqldb/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/news/feed.rss',
          hint: { key: 'sourceforge:news', label: 'News', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/news/feed.atom',
          hint: { key: 'sourceforge:news', label: 'News', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/discussion/feed',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/discussion/feed.atom',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/hsqldb/bugs/feed',
          hint: { key: 'sourceforge:bugs', label: 'Bugs' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the activity key for an activity feed', () => {
      const value = 'https://sourceforge.net/p/passwordsafe/activity/feed'
      const expected = 'sourceforge:activity'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the project feed key for a project feed', () => {
      const value = 'https://sourceforge.net/p/passwordsafe/feed'
      const expected = 'sourceforge:project-feed'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the project feed key for a project feed with an rss extension', () => {
      const value = 'https://sourceforge.net/p/freedos/feed.rss'
      const expected = 'sourceforge:project-feed'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the project feed key for a project feed with an atom extension', () => {
      const value = 'https://sourceforge.net/p/openlte/feed.atom'
      const expected = 'sourceforge:project-feed'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the files key for a files feed', () => {
      const value = 'https://sourceforge.net/projects/expect/rss'
      const expected = 'sourceforge:files'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the files key for a files feed of one folder', () => {
      const value = 'https://sourceforge.net/projects/expect/rss?path=%2FExpect'
      const expected = 'sourceforge:files'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the news key for a news rss feed', () => {
      const value = 'https://sourceforge.net/p/clonezilla/news/feed.rss'
      const expected = 'sourceforge:news'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the news key for a news feed without an extension', () => {
      const value = 'https://sourceforge.net/p/jabref/news/feed'
      const expected = 'sourceforge:news'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the news key for a news atom feed', () => {
      const value = 'https://sourceforge.net/p/xblast/news/feed.atom'
      const expected = 'sourceforge:news'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the discussion key for a discussion rss feed', () => {
      const value = 'https://sourceforge.net/p/hsqldb/discussion/feed'
      const expected = 'sourceforge:discussion'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the discussion key for a discussion atom feed', () => {
      const value = 'https://sourceforge.net/p/hsqldb/discussion/feed.atom'
      const expected = 'sourceforge:discussion'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the bugs key for a bugs feed', () => {
      const value = 'https://sourceforge.net/p/hsqldb/bugs/feed'
      const expected = 'sourceforge:bugs'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the activity key for an activity feed over http', () => {
      const value = 'http://sourceforge.net/p/hsqldb/activity/feed'
      const expected = 'sourceforge:activity'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the files key for a files feed on the www host', () => {
      const value = 'https://www.sourceforge.net/projects/hsqldb/rss'
      const expected = 'sourceforge:files'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a project page', () => {
      const value = 'https://sourceforge.net/projects/hsqldb'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a discussion thread feed', () => {
      const value = 'https://sourceforge.net/p/hsqldb/discussion/708858/thread/f4155d65/feed.rss'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/p/hsqldb/activity/feed'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for an invalid URL', () => {
      const value = 'not a url'

      expect(sourceforgeHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'http://sourceforge.net/p/hsqldb/activity/feed',
        { key: 'sourceforge:activity', label: 'Recent activity' },
      ],
      [
        'http://sourceforge.net/p/hsqldb/feed',
        { key: 'sourceforge:project-feed', label: 'Project feed' },
      ],
      [
        'https://sourceforge.net/p/openlte/feed.atom',
        { key: 'sourceforge:project-feed', label: 'Project feed' },
      ],
      [
        'http://sourceforge.net/projects/hsqldb/rss',
        { key: 'sourceforge:files', label: 'File releases' },
      ],
      [
        'https://sourceforge.net/projects/expect/rss?path=%2FExpect',
        { key: 'sourceforge:files', label: 'File releases' },
      ],
      ['http://sourceforge.net/p/hsqldb/news/feed.rss', { key: 'sourceforge:news', label: 'News' }],
      ['https://sourceforge.net/p/jabref/news/feed', { key: 'sourceforge:news', label: 'News' }],
      [
        'http://sourceforge.net/p/hsqldb/news/feed.atom',
        { key: 'sourceforge:news', label: 'News' },
      ],
      [
        'http://sourceforge.net/p/hsqldb/discussion/feed',
        { key: 'sourceforge:discussion', label: 'Discussion' },
      ],
      [
        'http://sourceforge.net/p/hsqldb/discussion/feed.atom',
        { key: 'sourceforge:discussion', label: 'Discussion' },
      ],
      ['http://sourceforge.net/p/hsqldb/bugs/feed', { key: 'sourceforge:bugs', label: 'Bugs' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [sourceforgeHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
