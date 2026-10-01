import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isSmfHtml, smfHandler } from './smf.js'

const smfHtml = `
  <script>
    var smf_theme_url = "https://example.com/forum/Themes/default";
    var smf_scripturl = "https://example.com/forum/index.php";
  </script>
`
const siteFeeds: Array<DiscoverUriEntry> = [
  {
    uri: 'https://example.com/forum/index.php?action=.xml;type=rss2',
    hint: { key: 'smf:posts', label: 'Posts', format: 'rss' },
  },
  {
    uri: 'https://example.com/forum/index.php?action=.xml;type=atom',
    hint: { key: 'smf:posts', label: 'Posts', format: 'atom' },
  },
]
const boardFeeds: Array<DiscoverUriEntry> = [
  {
    uri: 'https://example.com/forum/index.php?action=.xml;type=rss2;board=11',
    hint: { key: 'smf:board', label: 'Board', format: 'rss' },
  },
  {
    uri: 'https://example.com/forum/index.php?action=.xml;type=atom;board=11',
    hint: { key: 'smf:board', label: 'Board', format: 'atom' },
  },
]

describe('isSmfHtml', () => {
  it('should return true for the script URL and theme URL variables', () => {
    expect(isSmfHtml(smfHtml)).toBe(true)
  })

  it('should return false for a script URL variable alone', () => {
    const value = '<script>var smf_scripturl = "https://example.com/index.php";</script>'

    expect(isSmfHtml(value)).toBe(false)
  })
})

describe('smfHandler', () => {
  describe('match', () => {
    it('should match an SMF page', () => {
      expect(smfHandler.match('https://example.com/forum/index.php', smfHtml)).toBe(true)
    })

    it('should not match another page', () => {
      expect(smfHandler.match('https://example.com/', '<html></html>')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should build the site feeds from the script URL', () => {
      expect(smfHandler.resolve('https://example.com/forum/', smfHtml)).toEqual(siteFeeds)
    })

    it('should drop the session id from the script URL', () => {
      const content = `
        <script>
          var smf_theme_url = "https://example.com/forum/Themes/default";
          var smf_scripturl = "https://example.com/forum/index.php?PHPSESSID=abc123&amp;";
        </script>
      `

      expect(smfHandler.resolve('https://example.com/forum/', content)).toEqual(siteFeeds)
    })

    it('should add the board feeds on a board page', () => {
      const value = 'https://example.com/forum/index.php?board=11.0'

      expect(smfHandler.resolve(value, smfHtml)).toEqual([...boardFeeds, ...siteFeeds])
    })

    it('should read the board from the index link on a topic page', () => {
      const value = 'https://example.com/forum/index.php?topic=345.0'
      const content = `
        <link
          rel="index"
          href="https://example.com/forum/index.php?PHPSESSID=abc123&amp;board=11.0"
        >
        ${smfHtml}
      `

      expect(smfHandler.resolve(value, content)).toEqual([...boardFeeds, ...siteFeeds])
    })

    it('should give the site feeds on a topic page without an index link', () => {
      const value = 'https://example.com/forum/index.php?topic=345.0'

      expect(smfHandler.resolve(value, smfHtml)).toEqual(siteFeeds)
    })

    it('should return nothing without the script URL', () => {
      expect(smfHandler.resolve('https://example.com/forum/', '<html></html>')).toEqual([])
    })
  })
})
