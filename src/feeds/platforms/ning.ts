import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers topic.
// Handler needed for: home.

export type NingUrl = { kind: 'topic'; topic: string } | { kind: 'home' }

const topicRegex = /^\/forum\/topics\/([^/]+)\/?$/i

const domains = ['ning.com']

// A network on its own domain is known only by its marker, so its feeds are built here but not
// claimed. Every row past the four `resolve` builds reads its value from a page link or a page id,
// so the table only claims it. A group's featured topics read as the group's forum, and a topic in
// a group is still that one topic.
const feeds = definePlatformFeeds(
  [
    { key: 'ning:topic', template: '{scheme}://{host}/forum/topics/{topic}?feed=yes&xn_auth=no' },
    {
      key: 'ning:topic',
      template: '{scheme}://{host}/group/{group}/forum/topics/{topic}?feed=yes&xn_auth=no',
    },
    { key: 'ning:activity', template: '{scheme}://{host}/activity/log/list?fmt=rss' },
    {
      key: 'ning:activity-member',
      template: '{scheme}://{host}/activity/log/list?fmt=rss&screenName={member}',
    },
    { key: 'ning:blog', template: '{scheme}://{host}/profiles/blog/feed?xn_auth=no' },
    {
      key: 'ning:blog-author',
      template: '{scheme}://{host}/profiles/blog/feed?user={user}&xn_auth=no',
    },
    { key: 'ning:blog-tag', template: '{scheme}://{host}/profiles/blog/feed?tag={tag}&xn_auth=no' },
    {
      key: 'ning:blog-featured',
      template: '{scheme}://{host}/profiles/blog/feed?promoted=1&xn_auth=no',
    },
    // The bare `/forum?feed=yes` answers with the forum page on some networks.
    { key: 'ning:forum', template: '{scheme}://{host}/forum/topic/list?feed=yes&xn_auth=no' },
    {
      key: 'ning:forum-group',
      template: '{scheme}://{host}/forum/topic/list?feed=yes&groupUrl={group}&xn_auth=no',
    },
    {
      key: 'ning:forum-featured',
      template: '{scheme}://{host}/forum/topic/list?featured=1&feed=yes&xn_auth=no',
    },
    {
      key: 'ning:forum-group',
      template: '{scheme}://{host}/group/{group}/forum?feed=yes&xn_auth=no',
    },
    {
      key: 'ning:forum-member',
      template: '{scheme}://{host}/forum/topic/listForContributor?feed=yes&user={user}&xn_auth=no',
    },
    {
      key: 'ning:forum-group-member',
      template:
        '{scheme}://{host}/group/{group}/forum/topic/listForContributor?feed=yes&user={user}&xn_auth=no',
    },
    {
      key: 'ning:forum-group-member',
      template:
        '{scheme}://{host}/forum/topic/listForContributor?feed=yes&groupUrl={group}&user={user}&xn_auth=no',
    },
    {
      key: 'ning:forum-tag',
      template: '{scheme}://{host}/forum/topic/listForTag?feed=yes&tag={tag}&xn_auth=no',
    },
    {
      key: 'ning:forum-group-tag',
      template:
        '{scheme}://{host}/group/{group}/forum/topic/listForTag?feed=yes&tag={tag}&xn_auth=no',
    },
    {
      key: 'ning:forum-group-tag',
      template:
        '{scheme}://{host}/forum/topic/listForTag?feed=yes&groupUrl={group}&tag={tag}&xn_auth=no',
    },
    {
      key: 'ning:blog-post-comments',
      template: '{scheme}://{host}/profiles/comment/feed?attachedTo={post}&xn_auth=no',
    },
    {
      key: 'ning:status-comments',
      template: '{scheme}://{host}/profiles/statuscomment/feed?attachedTo={status}&xn_auth=no',
    },
    {
      key: 'ning:album-comments',
      template: '{scheme}://{host}/photo/albumcomment/feed?attachedTo={album}&xn_auth=no',
    },
    {
      key: 'ning:photos-member',
      template:
        '{scheme}://{host}/photo/photo/listForContributor?rss=yes&screenName={member}&xn_auth=no',
    },
    {
      key: 'ning:videos-member',
      template:
        '{scheme}://{host}/video/video/listForContributor?rss=yes&screenName={member}&xn_auth=no',
    },
    {
      key: 'ning:videos-tag',
      template: '{scheme}://{host}/video/video/listTagged?rss=yes&tag={tag}&xn_auth=no',
    },
    {
      key: 'ning:event-comments',
      template: '{scheme}://{host}/events/comment/feed?attachedTo={event}&xn_auth=no',
    },
  ],
  { domains },
)

// Ning 3 networks send the same `ning_session` cookie and `x-xn-trace-token` header but serve
// none of these feeds, and only the classic networks load assets from this path.
export const isNingHtml = (content: string): boolean => {
  return content.includes('static.ning.com/socialnetworkmain/')
}

export const parseNingUrl = (url: string): NingUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const topic = parsedUrl.pathname.match(topicRegex)?.[1]

  if (topic) {
    return { kind: 'topic', topic }
  }

  return { kind: 'home' }
}

export const ningHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isNingHtml })) {
      return false
    }

    return parseNingUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNingUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'topic') {
      uris.push(page.getFeedEntry('ning:topic', { topic: parsed.topic }))
    }

    uris.push(
      page.getFeedEntry('ning:activity'),
      page.getFeedEntry('ning:blog'),
      page.getFeedEntry('ning:forum'),
    )

    return uris
  },

  getFeedHint: feeds.getFeedHint,
}
