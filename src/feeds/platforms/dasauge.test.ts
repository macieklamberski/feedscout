import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type DasaugeUrl, dasaugeHandler, parseDasaugeUrl } from './dasauge.js'

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
    const value = 'https://dasauge.de/-alice'
    const expected: DasaugeUrl = { kind: 'home' }

    expect(parseDasaugeUrl(value)).toEqual(expected)
  })

  it('should return home for a page on another dasauge host', () => {
    const value = 'https://dasauge.co.uk/jobs/'
    const expected: DasaugeUrl = { kind: 'home' }

    expect(parseDasaugeUrl(value)).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseDasaugeUrl('https://example.com/-alice/')).toBeUndefined()
  })
})

describe('dasaugeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://dasauge.de/-alice/'],
      [true, 'https://dasauge.ch/-alice/'],
      [true, 'https://dasauge.com/-alice/'],
      [true, 'https://dasauge.es/-alice/'],
      [true, 'https://dasauge.at/-alice/'],
      [true, 'https://dasauge.co.uk/-alice/'],
      [true, 'https://dasauge.fr/-alice/'],
      [true, 'https://dasauge.de/'],
      [true, 'https://dasauge.de/jobs/'],
      [false, 'https://shop.dasauge.de/-alice/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(dasaugeHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside dasauge', () => {
      expect(dasaugeHandler.resolve('https://example.com/-alice/')).toEqual([])
    })

    it('should return the site-wide feeds on the page host', () => {
      const value = 'https://dasauge.at/-carol-jones'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://dasauge.at/jobs/feed', hint: jobsHint },
        { uri: 'https://dasauge.at/workspaces/feed', hint: workspacesHint },
      ]

      expect(dasaugeHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http page', () => {
      const value = 'http://dasauge.de/'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'http://dasauge.de/jobs/feed', hint: jobsHint },
        { uri: 'http://dasauge.de/workspaces/feed', hint: workspacesHint },
      ]

      expect(dasaugeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the profile hint for a profile feed on another dasauge host', () => {
      const value = 'https://dasauge.co.uk/-alice/?rss='
      const expected: DiscoverUriHint = { key: 'dasauge:profile', label: 'Profile' }

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('discoverUrisFromPlatform', () => {
    it('should return a jobs feed as itself', async () => {
      const value = 'http://dasauge.ch/jobs/feed'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'http://dasauge.ch/jobs/feed', hint: jobsHint },
      ]
      const uris = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [dasaugeHandler],
        baseUrl: value,
      })

      expect(uris).toEqual(expected)
    })
  })
})
