import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type DasaugeUrl, dasaugeHandler, parseDasaugeUrl } from './dasauge.js'

const newsHint: DiscoverUriHint = { key: 'dasauge:news', label: 'News', format: 'atom' }
const jobsHint: DiscoverUriHint = { key: 'dasauge:jobs', label: 'Jobs', format: 'atom' }
const workspacesHint: DiscoverUriHint = {
  key: 'dasauge:workspaces',
  label: 'Workspaces',
  format: 'atom',
}

describe('parseDasaugeUrl', () => {
  it('should return home for the home page', () => {
    const value = 'https://dasauge.de/'
    const expected: DasaugeUrl = { kind: 'home' }

    expect(parseDasaugeUrl(value)).toEqual(expected)
  })

  it('should return home for a profile page', () => {
    const value = 'https://dasauge.de/-abstrusa'
    const expected: DasaugeUrl = { kind: 'home' }

    expect(parseDasaugeUrl(value)).toEqual(expected)
  })

  it('should return home for a page on another dasauge host', () => {
    const value = 'https://dasauge.co.uk/jobs/'
    const expected: DasaugeUrl = { kind: 'home' }

    expect(parseDasaugeUrl(value)).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseDasaugeUrl('https://example.com/-abstrusa/')).toBeUndefined()
  })
})

describe('dasaugeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://dasauge.de/-abstrusa/'],
      [true, 'https://dasauge.ch/-abstrusa/'],
      [true, 'https://dasauge.com/-abstrusa/'],
      [true, 'https://dasauge.es/-abstrusa/'],
      [true, 'https://dasauge.at/-abstrusa/'],
      [true, 'https://dasauge.co.uk/-abstrusa/'],
      [true, 'https://dasauge.fr/-abstrusa/'],
      [true, 'https://dasauge.de/'],
      [true, 'https://dasauge.de/jobs/'],
      [false, 'https://www.dasauge.de/-abstrusa/'],
      [false, 'https://shop.dasauge.de/-abstrusa/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(dasaugeHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside dasauge', () => {
      expect(dasaugeHandler.resolve('https://example.com/-abstrusa/')).toEqual([])
    })

    it('should return the site-wide feeds on the page host', () => {
      const value = 'https://dasauge.at/-elmar-theurer'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://dasauge.at/news/feed', hint: newsHint },
        { uri: 'https://dasauge.at/jobs/feed', hint: jobsHint },
        { uri: 'https://dasauge.at/workspaces/feed', hint: workspacesHint },
      ]

      expect(dasaugeHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http page', () => {
      const value = 'http://dasauge.de/'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'http://dasauge.de/news/feed', hint: newsHint },
        { uri: 'http://dasauge.de/jobs/feed', hint: jobsHint },
        { uri: 'http://dasauge.de/workspaces/feed', hint: workspacesHint },
      ]

      expect(dasaugeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the news hint for the news feed', () => {
      const value = 'https://dasauge.de/news/feed'

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(newsHint)
    })

    it('should return the jobs hint for the jobs feed', () => {
      const value = 'https://dasauge.co.uk/jobs/feed'

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(jobsHint)
    })

    it('should return the workspaces hint for the workspaces feed', () => {
      const value = 'https://dasauge.com/workspaces/feed'

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(workspacesHint)
    })

    it('should return the profile hint for a profile feed', () => {
      const value = 'https://dasauge.de/-alice/?rss'
      const expected: DiscoverUriHint = { key: 'dasauge:profile', label: 'Profile' }

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the profile hint for a profile feed with an empty rss value', () => {
      const value = 'https://dasauge.de/-alice/?rss='
      const expected: DiscoverUriHint = { key: 'dasauge:profile', label: 'Profile' }

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the profile hint for a profile feed without a trailing slash', () => {
      const value = 'https://dasauge.de/-alice?rss'
      const expected: DiscoverUriHint = { key: 'dasauge:profile', label: 'Profile' }

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the profile hint for a profile feed on another dasauge host', () => {
      const value = 'https://dasauge.co.uk/-alice/?rss='
      const expected: DiscoverUriHint = { key: 'dasauge:profile', label: 'Profile' }

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://dasauge.de/-alice/'

      expect(dasaugeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an rss query with a value', () => {
      const value = 'https://dasauge.de/-alice/?rss=1'

      expect(dasaugeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a directory listing feed', () => {
      const value = 'https://dasauge.de/profile/fotografen/?rss='

      expect(dasaugeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/-alice/?rss'

      expect(dasaugeHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('discoverUrisFromPlatform', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://dasauge.de/news/feed/', newsHint],
      ['http://dasauge.ch/jobs/feed', jobsHint],
      ['https://dasauge.es/workspaces/feed/', workspacesHint],
      ['https://dasauge.de/-alice/?rss', { key: 'dasauge:profile', label: 'Profile' }],
      ['https://dasauge.de/-alice/?rss=', { key: 'dasauge:profile', label: 'Profile' }],
      ['https://dasauge.co.uk/-alice?rss', { key: 'dasauge:profile', label: 'Profile' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [dasaugeHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
