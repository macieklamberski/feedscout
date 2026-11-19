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

    expect(parseSourceforgeUrl('https://sourceforge.net/projects/nmap/reviews')).toEqual(expected)
  })

  it('should return the tool and page for a ticket page', () => {
    const value = 'https://sourceforge.net/p/nmap/bugs/123'
    const expected: SourceforgeUrl = { kind: 'project', project: 'nmap', tool: 'bugs', page: '123' }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the tool without a page for a path below a tool page', () => {
    const value = 'https://sourceforge.net/p/example/code/HEAD/tree/'
    const expected: SourceforgeUrl = { kind: 'project', project: 'example', tool: 'code' }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the forum for a discussion forum page', () => {
    const value = 'https://sourceforge.net/p/example/discussion/12345/'
    const expected: SourceforgeUrl = { kind: 'project', project: 'example', forum: '12345' }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the decoded folder path for a files subfolder page', () => {
    const value = 'https://sourceforge.net/projects/example/files/Win%2064/Release/'
    const expected: SourceforgeUrl = {
      kind: 'project',
      project: 'example',
      path: '/Win 64/Release',
    }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the project for the files page', () => {
    const value = 'https://sourceforge.net/projects/example/files/'
    const expected: SourceforgeUrl = { kind: 'project', project: 'example' }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
  })

  it('should return the forum and thread for a discussion thread page', () => {
    const value = 'https://sourceforge.net/p/example/discussion/12345/thread/abc123/'
    const expected: SourceforgeUrl = {
      kind: 'project',
      project: 'example',
      forum: '12345',
      thread: 'abc123',
    }

    expect(parseSourceforgeUrl(value)).toEqual(expected)
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
    const exampleFeeds: Array<DiscoverUriEntry> = [
      {
        uri: 'https://sourceforge.net/p/example/activity/feed',
        hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'rss' },
      },
      {
        uri: 'https://sourceforge.net/p/example/activity/feed.atom',
        hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'atom' },
      },
      {
        uri: 'https://sourceforge.net/p/example/feed',
        hint: { key: 'sourceforge:project-feed', label: 'Project feed', format: 'rss' },
      },
      {
        uri: 'https://sourceforge.net/p/example/feed.atom',
        hint: { key: 'sourceforge:project-feed', label: 'Project feed', format: 'atom' },
      },
      {
        uri: 'https://sourceforge.net/projects/example/rss',
        hint: { key: 'sourceforge:files', label: 'File releases' },
      },
      {
        uri: 'https://sourceforge.net/p/example/news/feed.rss',
        hint: { key: 'sourceforge:news', label: 'News', format: 'rss' },
      },
      {
        uri: 'https://sourceforge.net/p/example/news/feed.atom',
        hint: { key: 'sourceforge:news', label: 'News', format: 'atom' },
      },
      {
        uri: 'https://sourceforge.net/p/example/discussion/feed',
        hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'rss' },
      },
      {
        uri: 'https://sourceforge.net/p/example/discussion/feed.atom',
        hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'atom' },
      },
      {
        uri: 'https://sourceforge.net/p/example/bugs/feed.rss',
        hint: { key: 'sourceforge:bugs', label: 'Bugs', format: 'rss' },
      },
      {
        uri: 'https://sourceforge.net/p/example/bugs/feed.atom',
        hint: { key: 'sourceforge:bugs', label: 'Bugs', format: 'atom' },
      },
    ]

    it('should return all feeds for a project page', () => {
      const value = 'https://sourceforge.net/projects/filezilla'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sourceforge.net/p/filezilla/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/activity/feed.atom',
          hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/feed.atom',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed', format: 'atom' },
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
          uri: 'https://sourceforge.net/p/filezilla/bugs/feed.rss',
          hint: { key: 'sourceforge:bugs', label: 'Bugs', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/filezilla/bugs/feed.atom',
          hint: { key: 'sourceforge:bugs', label: 'Bugs', format: 'atom' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the thread feeds for a discussion thread page', () => {
      const value = 'https://sourceforge.net/p/example/discussion/12345/thread/abc123/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sourceforge.net/p/example/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/activity/feed.atom',
          hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/feed.atom',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/projects/example/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
        {
          uri: 'https://sourceforge.net/p/example/news/feed.rss',
          hint: { key: 'sourceforge:news', label: 'News', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/news/feed.atom',
          hint: { key: 'sourceforge:news', label: 'News', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/discussion/feed',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/discussion/feed.atom',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/bugs/feed.rss',
          hint: { key: 'sourceforge:bugs', label: 'Bugs', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/bugs/feed.atom',
          hint: { key: 'sourceforge:bugs', label: 'Bugs', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/discussion/12345/thread/abc123/feed',
          hint: { key: 'sourceforge:discussion-thread', label: 'Thread', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/discussion/12345/thread/abc123/feed.atom',
          hint: { key: 'sourceforge:discussion-thread', label: 'Thread', format: 'atom' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the folder feed for a files subfolder page', () => {
      const value = 'https://sourceforge.net/projects/example/files/Win%2064/'
      const expected: Array<DiscoverUriEntry> = [
        ...exampleFeeds,
        {
          uri: 'https://sourceforge.net/projects/example/rss?path=/Win%2064',
          hint: { key: 'sourceforge:files-folder', label: 'Folder file releases' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forum feeds for a discussion forum page', () => {
      const value = 'https://sourceforge.net/p/example/discussion/12345/'
      const expected: Array<DiscoverUriEntry> = [
        ...exampleFeeds,
        {
          uri: 'https://sourceforge.net/p/example/discussion/12345/feed',
          hint: { key: 'sourceforge:discussion-forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/discussion/12345/feed.atom',
          hint: { key: 'sourceforge:discussion-forum', label: 'Forum', format: 'atom' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tool and page feeds for a wiki page', () => {
      const value = 'https://sourceforge.net/p/example/wiki/Home/'
      const expected: Array<DiscoverUriEntry> = [
        ...exampleFeeds,
        {
          uri: 'https://sourceforge.net/p/example/wiki/feed.rss',
          hint: { key: 'sourceforge:tool', label: 'Tool changes', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/wiki/feed.atom',
          hint: { key: 'sourceforge:tool', label: 'Tool changes', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/wiki/Home/feed.rss',
          hint: { key: 'sourceforge:tool-page', label: 'Page changes', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/wiki/Home/feed.atom',
          hint: { key: 'sourceforge:tool-page', label: 'Page changes', format: 'atom' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tool feeds for a code tree page', () => {
      const value = 'https://sourceforge.net/p/example/code/HEAD/tree/'
      const expected: Array<DiscoverUriEntry> = [
        ...exampleFeeds,
        {
          uri: 'https://sourceforge.net/p/example/code/feed.rss',
          hint: { key: 'sourceforge:tool', label: 'Tool changes', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/code/feed.atom',
          hint: { key: 'sourceforge:tool', label: 'Tool changes', format: 'atom' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the page feeds without a tool feed for a ticket page', () => {
      const value = 'https://sourceforge.net/p/example/bugs/2500/'
      const expected: Array<DiscoverUriEntry> = [
        ...exampleFeeds,
        {
          uri: 'https://sourceforge.net/p/example/bugs/2500/feed.rss',
          hint: { key: 'sourceforge:tool-page', label: 'Page changes', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/bugs/2500/feed.atom',
          hint: { key: 'sourceforge:tool-page', label: 'Page changes', format: 'atom' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the project feeds alone for a tool with rows of its own', () => {
      const value = 'https://sourceforge.net/p/example/news/'

      expect(sourceforgeHandler.resolve(value)).toEqual(exampleFeeds)
    })

    it('should return empty array for root page', () => {
      const value = 'https://sourceforge.net'

      expect(sourceforgeHandler.resolve(value)).toEqual([])
    })

    it('should return https feeds for an http page', () => {
      const value = 'http://sourceforge.net/projects/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sourceforge.net/p/example/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/activity/feed.atom',
          hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/feed.atom',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/projects/example/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
        {
          uri: 'https://sourceforge.net/p/example/news/feed.rss',
          hint: { key: 'sourceforge:news', label: 'News', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/news/feed.atom',
          hint: { key: 'sourceforge:news', label: 'News', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/discussion/feed',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/discussion/feed.atom',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/bugs/feed.rss',
          hint: { key: 'sourceforge:bugs', label: 'Bugs', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/bugs/feed.atom',
          hint: { key: 'sourceforge:bugs', label: 'Bugs', format: 'atom' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return apex feeds for a www page', () => {
      const value = 'https://www.sourceforge.net/p/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sourceforge.net/p/example/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/activity/feed.atom',
          hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/feed.atom',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/projects/example/rss',
          hint: { key: 'sourceforge:files', label: 'File releases' },
        },
        {
          uri: 'https://sourceforge.net/p/example/news/feed.rss',
          hint: { key: 'sourceforge:news', label: 'News', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/news/feed.atom',
          hint: { key: 'sourceforge:news', label: 'News', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/discussion/feed',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/discussion/feed.atom',
          hint: { key: 'sourceforge:discussion', label: 'Discussion', format: 'atom' },
        },
        {
          uri: 'https://sourceforge.net/p/example/bugs/feed.rss',
          hint: { key: 'sourceforge:bugs', label: 'Bugs', format: 'rss' },
        },
        {
          uri: 'https://sourceforge.net/p/example/bugs/feed.atom',
          hint: { key: 'sourceforge:bugs', label: 'Bugs', format: 'atom' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the bugs key for a bugs feed without an extension', () => {
      const value = 'https://sourceforge.net/p/example/bugs/feed'
      const expected: DiscoverUriHint = { key: 'sourceforge:bugs', label: 'Bugs', format: 'rss' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return the Atom activity feed of a mirror as itself', async () => {
      const value = 'https://sourceforge.net/mirror/example/activity/feed.atom'
      const options = {
        ...defaultPlatformOptions,
        handlers: [sourceforgeHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: { key: 'sourceforge:activity', label: 'Recent activity', format: 'atom' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
