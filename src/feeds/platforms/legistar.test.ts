import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type LegistarUrl, legistarHandler, parseLegistarUrl } from './legistar.js'

describe('parseLegistarUrl', () => {
  it('should return the legislation for a legislation detail page', () => {
    const value =
      'https://madison.legistar.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
    const expected: LegistarUrl = {
      kind: 'legislation',
      id: '1065902',
      guid: 'EFE087C2-C62A-40F9-B1F9-6E2975E86217',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })

  it('should return the meeting for a meeting detail page', () => {
    const value =
      'https://a2gov.legistar.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804&Options=info|&Search='
    const expected: LegistarUrl = {
      kind: 'meeting',
      id: '1373416',
      guid: '351F7891-35DC-4AE5-BCED-DA4B7A00E804',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })

  it('should ignore the case of the page name', () => {
    const value =
      'https://madison.legistar.com/legislationdetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
    const expected: LegistarUrl = {
      kind: 'legislation',
      id: '1065902',
      guid: 'EFE087C2-C62A-40F9-B1F9-6E2975E86217',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })

  it('should return undefined for a detail page without a GUID', () => {
    expect(
      parseLegistarUrl('https://madison.legistar.com/LegislationDetail.aspx?ID=1065902'),
    ).toBeUndefined()
  })

  it('should return undefined for a non-numeric ID', () => {
    expect(
      parseLegistarUrl(
        'https://madison.legistar.com/LegislationDetail.aspx?ID=abc&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217',
      ),
    ).toBeUndefined()
  })

  it('should return undefined for a malformed GUID', () => {
    expect(
      parseLegistarUrl('https://madison.legistar.com/LegislationDetail.aspx?ID=1065902&GUID=abc'),
    ).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseLegistarUrl('not a url')).toBeUndefined()
  })

  it('should return undefined for another page', () => {
    expect(parseLegistarUrl('https://madison.legistar.com/Calendar.aspx')).toBeUndefined()
  })

  it('should return undefined for another detail page', () => {
    expect(
      parseLegistarUrl(
        'https://madison.legistar.com/DepartmentDetail.aspx?ID=17411&GUID=ED5B7181-AD76-4EF5-9730-729ACA9BFE9C',
      ),
    ).toBeUndefined()
  })

  it('should return the legislation for a detail page on a custom domain', () => {
    const value =
      'https://example.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
    const expected: LegistarUrl = {
      kind: 'legislation',
      id: '1065902',
      guid: 'EFE087C2-C62A-40F9-B1F9-6E2975E86217',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })
})

describe('legistarHandler', () => {
  describe('match', () => {
    it('should match a Legistar detail page', () => {
      const value =
        'https://nashville.legistar.com/LegislationDetail.aspx?ID=6706761&GUID=053E478F-E646-4638-A793-24217381CB5E'

      expect(legistarHandler.match(value)).toBe(true)
    })

    it('should match a detail page on a custom domain by the load balancer cookie', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804'
      const headers = new Headers()
      headers.append('set-cookie', 'ASP.NET_SessionId=abc; path=/; secure; HttpOnly')
      headers.append(
        'set-cookie',
        'BIGipServerinsite.legistar.com_443=908198666.47873.0000; path=/; Httponly; Secure',
      )

      expect(legistarHandler.match(value, '', headers)).toBe(true)
    })

    it('should match a detail page on a custom domain by the share widget', () => {
      const value =
        'https://example.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
      const content =
        '<script type="text/javascript" src="https://s7.addthis.com/js/300/addthis_widget.js#username=legistarinsite"></script>'

      expect(legistarHandler.match(value, content)).toBe(true)
    })

    it('should not match a detail page on a custom domain with another AddThis account', () => {
      const value =
        'https://example.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
      const content =
        '<script type="text/javascript" src="https://s7.addthis.com/js/300/addthis_widget.js#username=ra-4f0c7ab43a6b6e1f"></script>'

      expect(legistarHandler.match(value, content)).toBe(false)
    })

    it('should not match a detail page on a custom domain without a marker', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804'
      const headers = new Headers({ 'set-cookie': 'ASP.NET_SessionId=abc; path=/' })

      expect(legistarHandler.match(value, '', headers)).toBe(false)
    })

    it('should not match a detail page on a custom domain with another load balancer cookie', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804'
      const headers = new Headers({
        'set-cookie': 'BIGipServerlegistar_api_443=908198666.47873.0000; path=/',
      })

      expect(legistarHandler.match(value, '', headers)).toBe(false)
    })

    it('should not match another page', () => {
      expect(legistarHandler.match('https://madison.legistar.com/Calendar.aspx')).toBe(false)
    })

    it('should not match another page on a custom domain', () => {
      const headers = new Headers({
        'set-cookie': 'BIGipServerinsite.legistar.com_443=908198666.47873.0000; path=/',
      })

      expect(legistarHandler.match('https://example.com/Calendar.aspx', '', headers)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the legislation feed', () => {
      const value =
        'https://madison.legistar.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://madison.legistar.com/Feed.ashx?M=LD&ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217',
          hint: { key: 'legistar:legislation', label: 'Legislation' },
        },
      ]

      expect(legistarHandler.resolve(value)).toEqual(expected)
    })

    it('should return the meeting feed', () => {
      const value =
        'https://a2gov.legistar.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://a2gov.legistar.com/Feed.ashx?M=CalendarDetail&ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804',
          hint: { key: 'legistar:meeting', label: 'Meeting' },
        },
      ]

      expect(legistarHandler.resolve(value)).toEqual(expected)
    })

    it('should return the legislation feed on a custom domain', () => {
      const value =
        'https://example.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/Feed.ashx?M=LD&ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217',
          hint: { key: 'legistar:legislation', label: 'Legislation' },
        },
      ]

      expect(legistarHandler.resolve(value)).toEqual(expected)
    })

    it('should spell the meeting feed as the page alternate link spells it', () => {
      const value =
        'https://springfield.legistar.com/MeetingDetail.aspx?ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D'
      const content =
        '<link href="Feed.ashx?M=CalendarDetail&amp;ID=1234567&amp;GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D&amp;Title=City+of+Springfield+-+Meeting+of+Park+Advisory+Commission+on+9%2f15%2f2026+at+4%3a00+PM" rel="alternate" type="application/rss+xml" title="City of Springfield - Meeting of Park Advisory Commission on 9/15/2026 at 4:00 PM" />'
      const expected = [
        {
          uri: 'https://springfield.legistar.com/Feed.ashx?M=CalendarDetail&ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D&Title=City+of+Springfield+-+Meeting+of+Park+Advisory+Commission+on+9%2f15%2f2026+at+4%3a00+PM',
          hint: { key: 'legistar:meeting', label: 'Meeting' },
        },
      ]

      expect(legistarHandler.resolve(value, content)).toEqual(expected)
    })

    it('should spell the meeting feed as the page alternate link spells it on a custom domain', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D'
      const content =
        '<link href="Feed.ashx?M=CalendarDetail&amp;ID=1234567&amp;GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D&amp;Title=Example+County+-+Meeting+of+Mayor%27s+Commission+on+7%2f9%2f2024+at+4%3a00+PM" rel="alternate" type="application/rss+xml" title="Example County - Meeting of Mayor&#39;s Commission on 7/9/2024 at 4:00 PM" />'
      const expected = [
        {
          uri: 'https://example.com/Feed.ashx?M=CalendarDetail&ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D&Title=Example+County+-+Meeting+of+Mayor%27s+Commission+on+7%2f9%2f2024+at+4%3a00+PM',
          hint: { key: 'legistar:meeting', label: 'Meeting' },
        },
      ]

      expect(legistarHandler.resolve(value, content)).toEqual(expected)
    })

    it('should spell the meeting feed as the page alternate link spells it when the page GUID differs in case', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1234567&GUID=0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d'
      const content =
        '<link href="Feed.ashx?M=CalendarDetail&amp;ID=1234567&amp;GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D&amp;Title=Example+County+-+Meeting+of+Mayor%27s+Commission+on+7%2f9%2f2024+at+4%3a00+PM" rel="alternate" type="application/rss+xml" title="Example County - Meeting of Mayor&#39;s Commission on 7/9/2024 at 4:00 PM" />'
      const expected = [
        {
          uri: 'https://example.com/Feed.ashx?M=CalendarDetail&ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D&Title=Example+County+-+Meeting+of+Mayor%27s+Commission+on+7%2f9%2f2024+at+4%3a00+PM',
          hint: { key: 'legistar:meeting', label: 'Meeting' },
        },
      ]

      expect(legistarHandler.resolve(value, content)).toEqual(expected)
    })

    it('should spell the legislation feed as the page alternate link spells it', () => {
      const value =
        'https://example.com/LegislationDetail.aspx?ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D'
      const content =
        '<link href="Feed.ashx?M=LD&amp;ID=1234567&amp;GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D&amp;Extra=1" rel="alternate" type="application/rss+xml" />'
      const expected = [
        {
          uri: 'https://example.com/Feed.ashx?M=LD&ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D&Extra=1',
          hint: { key: 'legistar:legislation', label: 'Legislation' },
        },
      ]

      expect(legistarHandler.resolve(value, content)).toEqual(expected)
    })

    it('should ignore an alternate link with another GUID', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D'
      const content =
        '<link href="Feed.ashx?M=CalendarDetail&amp;ID=1234567&amp;GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4E&amp;Title=Example+County+-+Meeting+of+Planning+Commission+on+7%2f9%2f2024+at+4%3a00+PM" rel="alternate" type="application/rss+xml" />'
      const expected = [
        {
          uri: 'https://example.com/Feed.ashx?M=CalendarDetail&ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D',
          hint: { key: 'legistar:meeting', label: 'Meeting' },
        },
      ]

      expect(legistarHandler.resolve(value, content)).toEqual(expected)
    })

    it('should ignore an alternate link whose GUID extends the page GUID', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D'
      const content =
        '<link href="Feed.ashx?M=CalendarDetail&amp;ID=1234567&amp;GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4DFF&amp;Title=Example+County+-+Meeting+of+Planning+Commission+on+7%2f9%2f2024+at+4%3a00+PM" rel="alternate" type="application/rss+xml" />'
      const expected = [
        {
          uri: 'https://example.com/Feed.ashx?M=CalendarDetail&ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D',
          hint: { key: 'legistar:meeting', label: 'Meeting' },
        },
      ]

      expect(legistarHandler.resolve(value, content)).toEqual(expected)
    })

    it('should ignore an alternate link to another meeting', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D'
      const content =
        '<link href="Feed.ashx?M=CalendarDetail&amp;ID=12345678&amp;GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D&amp;Title=Example+County+-+Meeting+of+Planning+Commission+on+7%2f9%2f2024+at+4%3a00+PM" rel="alternate" type="application/rss+xml" />'
      const expected = [
        {
          uri: 'https://example.com/Feed.ashx?M=CalendarDetail&ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D',
          hint: { key: 'legistar:meeting', label: 'Meeting' },
        },
      ]

      expect(legistarHandler.resolve(value, content)).toEqual(expected)
    })

    it('should spell the meeting feed from the page URL for a page without an alternate link', () => {
      const value =
        'https://example.com/MeetingDetail.aspx?ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D'
      const content = '<html><head><title>Meeting</title></head><body></body></html>'
      const expected = [
        {
          uri: 'https://example.com/Feed.ashx?M=CalendarDetail&ID=1234567&GUID=0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D',
          hint: { key: 'legistar:meeting', label: 'Meeting' },
        },
      ]

      expect(legistarHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array for another page', () => {
      expect(legistarHandler.resolve('https://example.com/')).toEqual([])
    })
  })
})
