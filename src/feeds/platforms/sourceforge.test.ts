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

    it('should return the thread feeds for a discussion thread page', () => {
      const value = 'https://sourceforge.net/p/example/discussion/12345/thread/abc123/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sourceforge.net/p/example/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/p/example/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed' },
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
          uri: 'https://sourceforge.net/p/example/bugs/feed',
          hint: { key: 'sourceforge:bugs', label: 'Bugs' },
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

    it('should return empty array for root page', () => {
      const value = 'https://sourceforge.net'

      expect(sourceforgeHandler.resolve(value)).toEqual([])
    })

    it('should return https feeds for an http page', () => {
      const value = 'http://sourceforge.net/projects/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sourceforge.net/p/example/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/p/example/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed' },
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
          uri: 'https://sourceforge.net/p/example/bugs/feed',
          hint: { key: 'sourceforge:bugs', label: 'Bugs' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return apex feeds for a www page', () => {
      const value = 'https://www.sourceforge.net/p/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sourceforge.net/p/example/activity/feed',
          hint: { key: 'sourceforge:activity', label: 'Recent activity' },
        },
        {
          uri: 'https://sourceforge.net/p/example/feed',
          hint: { key: 'sourceforge:project-feed', label: 'Project feed' },
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
          uri: 'https://sourceforge.net/p/example/bugs/feed',
          hint: { key: 'sourceforge:bugs', label: 'Bugs' },
        },
      ]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the activity key for an activity feed', () => {
      const value = 'https://sourceforge.net/p/example/activity/feed'
      const expected: DiscoverUriHint = { key: 'sourceforge:activity', label: 'Recent activity' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project feed key for a project feed', () => {
      const value = 'https://sourceforge.net/p/example/feed'
      const expected: DiscoverUriHint = { key: 'sourceforge:project-feed', label: 'Project feed' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project feed key for a project feed with an rss extension', () => {
      const value = 'https://sourceforge.net/p/example/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:project-feed',
        label: 'Project feed',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project feed key for a project feed with an atom extension', () => {
      const value = 'https://sourceforge.net/p/example/feed.atom'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:project-feed',
        label: 'Project feed',
        format: 'atom',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the files key for a files feed', () => {
      const value = 'https://sourceforge.net/projects/example/rss'
      const expected: DiscoverUriHint = { key: 'sourceforge:files', label: 'File releases' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the files key for a files feed of one folder', () => {
      const value = 'https://sourceforge.net/projects/example/rss?path=%2FExpect'
      const expected: DiscoverUriHint = { key: 'sourceforge:files', label: 'File releases' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news key for a news rss feed', () => {
      const value = 'https://sourceforge.net/p/example/news/feed.rss'
      const expected: DiscoverUriHint = { key: 'sourceforge:news', label: 'News', format: 'rss' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news key for a news feed without an extension', () => {
      const value = 'https://sourceforge.net/p/example/news/feed'
      const expected: DiscoverUriHint = { key: 'sourceforge:news', label: 'News', format: 'rss' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news key for a news atom feed', () => {
      const value = 'https://sourceforge.net/p/example/news/feed.atom'
      const expected: DiscoverUriHint = { key: 'sourceforge:news', label: 'News', format: 'atom' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the discussion key for a discussion rss feed', () => {
      const value = 'https://sourceforge.net/p/example/discussion/feed'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:discussion',
        label: 'Discussion',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the discussion key for a discussion atom feed', () => {
      const value = 'https://sourceforge.net/p/example/discussion/feed.atom'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:discussion',
        label: 'Discussion',
        format: 'atom',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the bugs key for a bugs feed', () => {
      const value = 'https://sourceforge.net/p/example/bugs/feed'
      const expected: DiscoverUriHint = { key: 'sourceforge:bugs', label: 'Bugs' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity key for an activity feed with an rss extension', () => {
      const value = 'https://sourceforge.net/p/example/activity/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:activity',
        label: 'Recent activity',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity key for an activity feed with an atom extension', () => {
      const value = 'https://sourceforge.net/p/example/activity/feed.atom'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:activity',
        label: 'Recent activity',
        format: 'atom',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the discussion key for a discussion feed with an rss extension', () => {
      const value = 'https://sourceforge.net/p/example/discussion/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:discussion',
        label: 'Discussion',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the bugs key for a bugs feed with an rss extension', () => {
      const value = 'https://sourceforge.net/p/example/bugs/feed.rss'
      const expected: DiscoverUriHint = { key: 'sourceforge:bugs', label: 'Bugs', format: 'rss' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the bugs key for a bugs feed with an atom extension', () => {
      const value = 'https://sourceforge.net/p/example/bugs/feed.atom'
      const expected: DiscoverUriHint = { key: 'sourceforge:bugs', label: 'Bugs', format: 'atom' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity key for an activity feed over http', () => {
      const value = 'http://sourceforge.net/p/example/activity/feed'
      const expected: DiscoverUriHint = { key: 'sourceforge:activity', label: 'Recent activity' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the files key for a files feed on the www host', () => {
      const value = 'https://www.sourceforge.net/projects/example/rss'
      const expected: DiscoverUriHint = { key: 'sourceforge:files', label: 'File releases' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a project page', () => {
      const value = 'https://sourceforge.net/projects/example'

      expect(sourceforgeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the thread key for a discussion thread feed', () => {
      const value = 'https://sourceforge.net/p/example/discussion/12345/thread/abc123/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:discussion-thread',
        label: 'Thread',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the thread key for a discussion thread atom feed', () => {
      const value = 'https://sourceforge.net/p/example/discussion/12345/thread/abc123/feed.atom'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:discussion-thread',
        label: 'Thread',
        format: 'atom',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the forum key for a discussion forum feed', () => {
      const value = 'https://sourceforge.net/p/example/discussion/12345/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:discussion-forum',
        label: 'Forum',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tool key for a wiki feed', () => {
      const value = 'https://sourceforge.net/p/example/wiki/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:tool',
        label: 'Tool changes',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tool key for a code repository atom feed', () => {
      const value = 'https://sourceforge.net/p/example/example-git/feed.atom'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:tool',
        label: 'Tool changes',
        format: 'atom',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tool page key for a wiki page feed', () => {
      const value = 'https://sourceforge.net/p/example/wiki/Home/feed.atom'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:tool-page',
        label: 'Page changes',
        format: 'atom',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tool page key for a ticket feed', () => {
      const value = 'https://sourceforge.net/p/example/bugs/12345/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:tool-page',
        label: 'Page changes',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the user key for a user feed', () => {
      const value = 'https://sourceforge.net/u/alice/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:user',
        label: 'User feed',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the user tool key for a user blog feed', () => {
      const value = 'https://sourceforge.net/u/alice/blog/feed'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:user-tool',
        label: 'User tool changes',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity key for a mirror activity feed', () => {
      const value = 'https://sourceforge.net/mirror/example/activity/feed'
      const expected: DiscoverUriHint = { key: 'sourceforge:activity', label: 'Recent activity' }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should keep the discussion key for a discussion feed beside the tool rows', () => {
      const value = 'https://sourceforge.net/p/example/discussion/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'sourceforge:discussion',
        label: 'Discussion',
        format: 'rss',
      }

      expect(sourceforgeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/p/example/activity/feed'

      expect(sourceforgeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an invalid URL', () => {
      const value = 'not a url'

      expect(sourceforgeHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'http://sourceforge.net/p/example/activity/feed',
        { key: 'sourceforge:activity', label: 'Recent activity' },
      ],
      [
        'http://sourceforge.net/p/example/feed',
        { key: 'sourceforge:project-feed', label: 'Project feed' },
      ],
      [
        'https://sourceforge.net/p/example/feed.atom',
        { key: 'sourceforge:project-feed', label: 'Project feed', format: 'atom' },
      ],
      [
        'http://sourceforge.net/projects/example/rss',
        { key: 'sourceforge:files', label: 'File releases' },
      ],
      [
        'https://sourceforge.net/projects/example/rss?path=%2FExpect',
        { key: 'sourceforge:files', label: 'File releases' },
      ],
      [
        'http://sourceforge.net/p/example/news/feed.rss',
        { key: 'sourceforge:news', label: 'News', format: 'rss' },
      ],
      [
        'https://sourceforge.net/p/example/news/feed',
        { key: 'sourceforge:news', label: 'News', format: 'rss' },
      ],
      [
        'http://sourceforge.net/p/example/news/feed.atom',
        { key: 'sourceforge:news', label: 'News', format: 'atom' },
      ],
      [
        'http://sourceforge.net/p/example/discussion/feed',
        { key: 'sourceforge:discussion', label: 'Discussion', format: 'rss' },
      ],
      [
        'http://sourceforge.net/p/example/discussion/feed.atom',
        { key: 'sourceforge:discussion', label: 'Discussion', format: 'atom' },
      ],
      ['http://sourceforge.net/p/example/bugs/feed', { key: 'sourceforge:bugs', label: 'Bugs' }],
      [
        'http://sourceforge.net/p/example/activity/feed.rss',
        { key: 'sourceforge:activity', label: 'Recent activity', format: 'rss' },
      ],
      [
        'http://sourceforge.net/p/example/activity/feed.atom',
        { key: 'sourceforge:activity', label: 'Recent activity', format: 'atom' },
      ],
      [
        'http://sourceforge.net/p/example/discussion/feed.rss',
        { key: 'sourceforge:discussion', label: 'Discussion', format: 'rss' },
      ],
      [
        'http://sourceforge.net/p/example/bugs/feed.rss',
        { key: 'sourceforge:bugs', label: 'Bugs', format: 'rss' },
      ],
      [
        'http://sourceforge.net/p/example/bugs/feed.atom',
        { key: 'sourceforge:bugs', label: 'Bugs', format: 'atom' },
      ],
      [
        'http://sourceforge.net/p/example/discussion/12345/thread/abc123/feed.rss',
        { key: 'sourceforge:discussion-thread', label: 'Thread', format: 'rss' },
      ],
      [
        'http://sourceforge.net/p/example/discussion/12345/feed.rss',
        { key: 'sourceforge:discussion-forum', label: 'Forum', format: 'rss' },
      ],
      [
        'http://sourceforge.net/p/example/wiki/feed',
        { key: 'sourceforge:tool', label: 'Tool changes', format: 'rss' },
      ],
      [
        'http://sourceforge.net/p/example/wiki/Home/feed.atom',
        { key: 'sourceforge:tool-page', label: 'Page changes', format: 'atom' },
      ],
      [
        'http://sourceforge.net/u/alice/feed.atom',
        { key: 'sourceforge:user', label: 'User feed', format: 'atom' },
      ],
      [
        'http://sourceforge.net/u/alice/blog/feed.rss',
        { key: 'sourceforge:user-tool', label: 'User tool changes', format: 'rss' },
      ],
      [
        'https://sourceforge.net/mirror/example/activity/feed.rss',
        { key: 'sourceforge:activity', label: 'Recent activity', format: 'rss' },
      ],
      [
        'https://sourceforge.net/mirror/example/activity/feed.atom',
        { key: 'sourceforge:activity', label: 'Recent activity', format: 'atom' },
      ],
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
