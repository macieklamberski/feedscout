import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  getSermonNetPage,
  parseSermonNetUrl,
  type SermonNetPage,
  type SermonNetUrl,
  sermonNetHandler,
} from './sermonNet.js'

const faithChapelHtml = `
  <script type="text/javascript">
    var StudioAppData = {"id":103765,"organization":"Faith Chapel Church","url":"FaithChapelChurch","allPlaylists":[{"id":4048401,"title":"Faith Chapel Church","parent_id":null,"is_series":false,"url":"faithchapel"},{"id":4048384,"title":"Faith Chapel Church","parent_id":null,"is_series":true,"url":"main"}],"Playlists":{"collection":[{"id":4048401,"parent_id":null,"is_series":false,"url":"faithchapel"}]}};
  </script>
`

describe('parseSermonNetUrl', () => {
  it('should return the church for a church subdomain', () => {
    const expected: SermonNetUrl = { kind: 'church', tenant: 'faithchapelchurch' }

    expect(parseSermonNetUrl('https://faithchapelchurch.sermon.net/')).toEqual(expected)
  })

  it('should return the channel for a posting page', () => {
    const expected: SermonNetUrl = { kind: 'channel', tenant: 'faithchapelchurch', channel: 'main' }

    expect(parseSermonNetUrl('https://faithchapelchurch.sermon.net/main/main/21538657')).toEqual(
      expected,
    )
  })

  it('should return the channel for a channel page', () => {
    const expected: SermonNetUrl = { kind: 'channel', tenant: 'waysidechapel', channel: 'joshua' }

    expect(parseSermonNetUrl('https://waysidechapel.sermon.net/main/joshua')).toEqual(expected)
  })

  it('should return the church for a media centre page', () => {
    const expected: SermonNetUrl = { kind: 'church', tenant: 'upc' }

    expect(parseSermonNetUrl('https://upc.sermon.net/Sermon_Player')).toEqual(expected)
  })

  it('should return undefined for the www subdomain', () => {
    expect(parseSermonNetUrl('https://www.sermon.net/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseSermonNetUrl('https://sermon.net/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseSermonNetUrl('https://www.example.sermon.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSermonNetUrl('https://example.com/')).toBeUndefined()
  })
})

describe('getSermonNetPage', () => {
  it('should return every channel and series the church page lists once', () => {
    const value = 'https://faithchapelchurch.sermon.net/'
    const expected: SermonNetPage = {
      kind: 'church',
      tenant: 'faithchapelchurch',
      channels: ['faithchapel', 'main'],
    }

    expect(getSermonNetPage(value, faithChapelHtml)).toEqual(expected)
  })

  it('should return the channel a channel page names', () => {
    const value = 'https://faithchapelchurch.sermon.net/main/faithchapel'
    const expected: SermonNetPage = {
      kind: 'channel',
      tenant: 'faithchapelchurch',
      channel: 'faithchapel',
    }

    expect(getSermonNetPage(value, faithChapelHtml)).toEqual(expected)
  })

  it('should fall back to the church for a channel the page does not list', () => {
    const value = 'https://faithchapelchurch.sermon.net/main/shared'
    const expected: SermonNetPage = {
      kind: 'church',
      tenant: 'faithchapelchurch',
      channels: ['faithchapel', 'main'],
    }

    expect(getSermonNetPage(value, faithChapelHtml)).toEqual(expected)
  })

  it('should return the church with no channel without content', () => {
    const value = 'https://faithchapelchurch.sermon.net/'
    const expected: SermonNetPage = { kind: 'church', tenant: 'faithchapelchurch', channels: [] }

    expect(getSermonNetPage(value, undefined)).toEqual(expected)
  })
})

describe('sermonNetHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://bcf.sermon.net/'],
      [false, 'https://www.sermon.net/'],
      [false, 'https://example.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(sermonNetHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Sermon.net', () => {
      expect(sermonNetHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the audio feed of every channel and series the page lists', () => {
      const value = 'https://faithchapelchurch.sermon.net/'
      const content = faithChapelHtml
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://faithchapelchurch.sermon.net/rss/faithchapel/audio',
          hint: { key: 'sermon-net:channel', label: 'Channel podcast' },
        },
        {
          uri: 'https://faithchapelchurch.sermon.net/rss/main/audio',
          hint: { key: 'sermon-net:channel', label: 'Channel podcast' },
        },
      ]

      expect(sermonNetHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return only the feed of the channel a channel page names', () => {
      const value = 'https://faithchapelchurch.sermon.net/main/faithchapel'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://faithchapelchurch.sermon.net/rss/faithchapel/audio',
          hint: { key: 'sermon-net:channel', label: 'Channel podcast' },
        },
      ]

      expect(sermonNetHandler.resolve(value, faithChapelHtml)).toEqual(expected)
    })

    it('should return every listed channel when a channel page names an unlisted one', () => {
      const value = 'https://faithchapelchurch.sermon.net/main/shared'

      expect(sermonNetHandler.resolve(value, faithChapelHtml)).toHaveLength(2)
    })

    it('should return the church feed for a page that lists no channel', () => {
      const value = 'https://refugeembassy.sermon.net/'
      const content = '<p>Oops... currently there is no Media available at this URL.</p>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://refugeembassy.sermon.net/rss',
          hint: { key: 'sermon-net:church', label: 'Church' },
        },
      ]

      expect(sermonNetHandler.resolve(value, content)).toEqual(expected)
    })

    it('should escape a slash in a channel the page lists', () => {
      const value = 'https://faithchapelchurch.sermon.net/'
      const content =
        'var StudioAppData = {"allPlaylists":[{"is_series":true,"url":"main/extra"}]};'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://faithchapelchurch.sermon.net/rss/main%2Fextra/audio',
          hint: { key: 'sermon-net:channel', label: 'Channel podcast' },
        },
      ]

      expect(sermonNetHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the https feed of a channel page opened over http', () => {
      const value = 'http://example.sermon.net/main/sermons'
      const content = 'var StudioAppData = {"allPlaylists":[{"is_series":true,"url":"sermons"}]};'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.sermon.net/rss/sermons/audio',
          hint: { key: 'sermon-net:channel', label: 'Channel podcast' },
        },
      ]

      expect(sermonNetHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the https church feed of a church page opened over http', () => {
      const value = 'http://example.sermon.net/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.sermon.net/rss',
          hint: { key: 'sermon-net:church', label: 'Church' },
        },
      ]

      expect(sermonNetHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the channel key for the audio feed of a channel', () => {
      const value = 'https://example.sermon.net/rss/sermons/audio'
      const expected = 'sermon-net:channel'

      expect(sermonNetHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the channel key for the audio and PDF feed of a channel', () => {
      const value = 'https://example.sermon.net/rss/sermons/audio_pdf'
      const expected = 'sermon-net:channel'

      expect(sermonNetHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the channel key for a channel with an escaped slash', () => {
      const value = 'https://example.sermon.net/rss/main%2Fextra/audio'
      const expected = 'sermon-net:channel'

      expect(sermonNetHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the church key for the church feed', () => {
      const value = 'https://example.sermon.net/rss'
      const expected = 'sermon-net:church'

      expect(sermonNetHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the church key for the church feed over http', () => {
      const value = 'http://example.sermon.net/rss'
      const expected = 'sermon-net:church'

      expect(sermonNetHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a channel page', () => {
      const value = 'https://example.sermon.net/main/sermons'

      expect(sermonNetHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the video feed of a channel', () => {
      const value = 'https://example.sermon.net/rss/sermons/video'

      expect(sermonNetHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the church feed path on the www host', () => {
      const value = 'https://www.sermon.net/rss'

      expect(sermonNetHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const channelHint: DiscoverUriHint = { key: 'sermon-net:channel', label: 'Channel podcast' }
    const churchHint: DiscoverUriHint = { key: 'sermon-net:church', label: 'Church' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://example.sermon.net/rss/sermons/audio', channelHint],
      ['http://example.sermon.net/rss/sermons/audio_pdf', channelHint],
      ['https://example.sermon.net/rss/', churchHint],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [sermonNetHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
