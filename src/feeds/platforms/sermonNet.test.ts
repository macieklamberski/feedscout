import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { parseSermonNetUrl, type SermonNetUrl, sermonNetHandler } from './sermonNet.js'

const faithChapelHtml = `
  <script type="text/javascript">
    var StudioAppData = {"id":103765,"organization":"Faith Chapel Church","url":"FaithChapelChurch","allPlaylists":[{"id":4048401,"title":"Faith Chapel Church","parent_id":null,"is_series":false,"url":"faithchapel"},{"id":4048384,"title":"Faith Chapel Church","parent_id":null,"is_series":true,"url":"main"}],"Playlists":{"collection":[{"id":4048401,"parent_id":null,"is_series":false,"url":"faithchapel"}]}};
  </script>
`

describe('parseSermonNetUrl', () => {
  it('should return the church for a church subdomain', () => {
    const expected: SermonNetUrl = { kind: 'church' }

    expect(parseSermonNetUrl('https://faithchapelchurch.sermon.net/')).toEqual(expected)
  })

  it('should return the channel for a posting page', () => {
    const expected: SermonNetUrl = { kind: 'channel', channel: 'main' }

    expect(parseSermonNetUrl('https://faithchapelchurch.sermon.net/main/main/21538657')).toEqual(
      expected,
    )
  })

  it('should return the channel for a channel page', () => {
    const expected: SermonNetUrl = { kind: 'channel', channel: 'joshua' }

    expect(parseSermonNetUrl('https://waysidechapel.sermon.net/main/joshua')).toEqual(expected)
  })

  it('should return the church for a media centre page', () => {
    const expected: SermonNetUrl = { kind: 'church' }

    expect(parseSermonNetUrl('https://upc.sermon.net/Sermon_Player')).toEqual(expected)
  })

  it('should return undefined for the www subdomain', () => {
    expect(parseSermonNetUrl('https://www.sermon.net/')).toBeUndefined()
  })

  it('should return undefined for the api subdomain', () => {
    expect(parseSermonNetUrl('https://api.sermon.net/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseSermonNetUrl('https://sermon.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSermonNetUrl('https://example.com/')).toBeUndefined()
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
  })
})
