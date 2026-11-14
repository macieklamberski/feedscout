import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  getSermonNetPage,
  parseSermonNetUrl,
  type SermonNetPage,
  type SermonNetUrl,
  sermonNetHandler,
} from './sermonNet.js'

const graceHillHtml = `
  <script type="text/javascript">
    var StudioAppData = {"id":103765,"organization":"Grace Hill chUrch","url":"GraceHillchUrch","allPlaylists":[{"id":4048401,"title":"Grace Hill chUrch","parent_id":null,"is_series":false,"url":"gracehill"},{"id":4048384,"title":"Grace Hill chUrch","parent_id":null,"is_series":true,"url":"main"}],"Playlists":{"collection":[{"id":4048401,"parent_id":null,"is_series":false,"url":"gracehill"}]}};
  </script>
`

describe('parseSermonNetUrl', () => {
  it('should return the church for a church subdomain', () => {
    const expected: SermonNetUrl = { kind: 'church' }

    expect(parseSermonNetUrl('https://gracehillchurch.sermon.net/')).toEqual(expected)
  })

  it('should return the channel for a posting page', () => {
    const expected: SermonNetUrl = { kind: 'channel', channel: 'main' }

    expect(parseSermonNetUrl('https://gracehillchurch.sermon.net/main/main/21538657')).toEqual(
      expected,
    )
  })

  it('should return the channel for a channel page', () => {
    const expected: SermonNetUrl = { kind: 'channel', channel: 'bob' }

    expect(parseSermonNetUrl('https://oakchapel.sermon.net/main/bob')).toEqual(expected)
  })

  it('should return the church for a media centre page', () => {
    const expected: SermonNetUrl = { kind: 'church' }

    expect(parseSermonNetUrl('https://alicechurch.sermon.net/Sermon_Player')).toEqual(expected)
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
    const value = 'https://gracehillchurch.sermon.net/'
    const expected: SermonNetPage = { kind: 'church', channels: ['gracehill', 'main'] }

    expect(getSermonNetPage(value, graceHillHtml)).toEqual(expected)
  })

  it('should return the channel a channel page names', () => {
    const value = 'https://gracehillchurch.sermon.net/main/gracehill'
    const expected: SermonNetPage = { kind: 'channel', channel: 'gracehill' }

    expect(getSermonNetPage(value, graceHillHtml)).toEqual(expected)
  })

  it('should fall back to the church for a channel the page does not list', () => {
    const value = 'https://gracehillchurch.sermon.net/main/shared'
    const expected: SermonNetPage = { kind: 'church', channels: ['gracehill', 'main'] }

    expect(getSermonNetPage(value, graceHillHtml)).toEqual(expected)
  })

  it('should return the church with no channel without content', () => {
    const value = 'https://gracehillchurch.sermon.net/'
    const expected: SermonNetPage = { kind: 'church', channels: [] }

    expect(getSermonNetPage(value, undefined)).toEqual(expected)
  })
})

describe('sermonNetHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://bobchurch.sermon.net/'],
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
      const value = 'https://gracehillchurch.sermon.net/'
      const content = graceHillHtml
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://gracehillchurch.sermon.net/rss/gracehill/audio',
          hint: { key: 'sermon-net:channel', label: 'Channel podcast' },
        },
        {
          uri: 'https://gracehillchurch.sermon.net/rss/main/audio',
          hint: { key: 'sermon-net:channel', label: 'Channel podcast' },
        },
      ]

      expect(sermonNetHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return only the feed of the channel a channel page names', () => {
      const value = 'https://gracehillchurch.sermon.net/main/gracehill'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://gracehillchurch.sermon.net/rss/gracehill/audio',
          hint: { key: 'sermon-net:channel', label: 'Channel podcast' },
        },
      ]

      expect(sermonNetHandler.resolve(value, graceHillHtml)).toEqual(expected)
    })

    it('should return every listed channel when a channel page names an unlisted one', () => {
      const value = 'https://gracehillchurch.sermon.net/main/shared'

      expect(sermonNetHandler.resolve(value, graceHillHtml)).toHaveLength(2)
    })

    it('should return the church feed for a page that lists no channel', () => {
      const value = 'https://riverchurch.sermon.net/'
      const content = '<p>Oops... currently there is no Media available at this URL.</p>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://riverchurch.sermon.net/rss',
          hint: { key: 'sermon-net:church', label: 'Church' },
        },
      ]

      expect(sermonNetHandler.resolve(value, content)).toEqual(expected)
    })

    it('should escape a slash in a channel the page lists', () => {
      const value = 'https://gracehillchurch.sermon.net/'
      const content =
        'var StudioAppData = {"allPlaylists":[{"is_series":true,"url":"main/extra"}]};'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://gracehillchurch.sermon.net/rss/main%2Fextra/audio',
          hint: { key: 'sermon-net:channel', label: 'Channel podcast' },
        },
      ]

      expect(sermonNetHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
