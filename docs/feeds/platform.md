---
title: "Discover Feeds: Platform Method"
---

# Platform Method

The Platform method generates feed URLs for known platforms using URL pattern matching. It works without HTTP requests by recognizing URL structures specific to each platform.

## How It Works

The Platform method uses handlers for each supported platform:

1. **Pattern Matching** — Each handler checks if the URL matches its platform (e.g., `github.com`, `youtube.com`).
2. **URL Generation** — The matching handler generates feed URLs based on the URL structure.
3. **First Match** — The first matching handler wins; subsequent handlers are skipped.

> [!TIP]
> Even when feeds are discoverable via HTML `<link>` tags, the Platform method is useful because it generates feed URLs directly from the page URL—no HTTP request needed. This makes it faster when you only have a URL and want to avoid fetching the page content first.

## Hints

Platform handlers attach a `hint` to each feed URI they generate. Hints provide a machine-readable `key` and a human-readable `label` that describe what type of feed the URI represents (e.g., "All uploads", "Videos only", "Shorts only"). This is useful when a single URL generates multiple feed variants and you need to let users pick the right one, especially for feeds that don't include a descriptive title.

Hints are propagated to the final [`DiscoverResult`](/reference/types#discoverresult) objects returned by `discoverFeeds`. Results from non-platform methods (HTML, headers, guess) do not include hints.

```typescript
type DiscoverUriHint = {
  key: string    // e.g., 'youtube:all', 'youtube:videos'
  label: string  // e.g., 'All uploads', 'Videos only'
}
```

## Supported Platforms

### YouTube

Discovers Atom feeds for channels and playlists. Generates four feed variants for channels: all uploads, videos-only, shorts-only, and live streams-only.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `youtube.com/channel/{id}` | All uploads + videos-only + shorts-only + live streams-only |
| `youtube.com/@{handle}` | All uploads + videos-only + shorts-only + live streams-only* |
| `youtube.com/user/{name}` | All uploads + videos-only + shorts-only + live streams-only* |
| `youtube.com/c/{custom}` | All uploads + videos-only + shorts-only + live streams-only* |
| `youtube.com/watch?v={id}` | All uploads + videos-only + shorts-only + live streams-only* |
| `youtu.be/{id}` | All uploads + videos-only + shorts-only + live streams-only* |
| `youtube.com/playlist?list={id}` | Playlist feed |

\* *Requires HTML content to extract channel ID.*

### Reddit

Discovers RSS feeds for subreddits, users, multireddits, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `reddit.com` | Homepage feed |
| `reddit.com/r/{subreddit}` | Subreddit posts + comments |
| `reddit.com/r/{subreddit}/{sort}` | Sorted posts (hot/new/rising/top) |
| `reddit.com/r/{subreddit}/comments/{id}` | Post comments |
| `reddit.com/u/{username}` | User activity |
| `reddit.com/user/{username}/m/{multireddit}` | Multireddit feed |
| `reddit.com/domain/{domain}` | Domain submissions |

### Medium

Discovers RSS feeds for Medium user profiles, publications, tags, and subdomains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `medium.com/@{username}` | User posts feed |
| `medium.com/{publication}` | Publication feed |
| `medium.com/{publication}/tagged/{tag}` | Tagged publication feed |
| `*.medium.com` | Subdomain publication feed |
| `*.medium.com/tagged/{tag}` | Subdomain tagged feed |

### Substack

Discovers RSS feeds for Substack newsletters.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.substack.com` | Newsletter feed |

### WordPress.com

Discovers RSS and Atom feeds for WordPress.com blogs, with category, tag, and author support.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.wordpress.com` | Posts feed (RSS + Atom + RDF) + comments |
| `*.wordpress.com/category/{category}` | Category feed (+ above) |
| `*.wordpress.com/tag/{tag}` | Tag feed (+ above) |
| `*.wordpress.com/author/{author}` | Author feed (+ above) |

### WP Engine

Discovers feeds for WP Engine-hosted WordPress sites. Uses the same feed structure as [WordPress.com](#wordpresscom).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.wpenginepowered.com` | Same as WordPress.com |
| `*.wpengine.com` | Same as WordPress.com (legacy domain) |

### Blogspot

Discovers RSS and Atom feeds for Blogspot blogs, including label-specific feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blogspot.com` | Posts feed (Atom + RSS) |
| `*.blogspot.com/search/label/{label}` | Label feed (+ above) |

### DEV.to

Discovers RSS feeds for DEV.to user profiles and tags.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dev.to/{username}` | User posts feed |
| `dev.to/t/{tag}` | Tag posts feed |

### Lobsters

Discovers RSS feeds for Lobsters homepage, users, tags, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `lobste.rs` | Homepage feed |
| `lobste.rs/newest` | Newest posts feed |
| `lobste.rs/top` | Top stories feed |
| `lobste.rs/top/{period}` | Top stories by period (1d/3d/1w/1m/1y) |
| `lobste.rs/comments` | Site-wide comments feed |
| `lobste.rs/~{username}` | User stories feed |
| `lobste.rs/t/{tag}` | Tag feed |
| `lobste.rs/t/{tag1},{tag2}` | Multi-tag feed |
| `lobste.rs/domains/{domain}` | Domain feed |

### Goodreads

Discovers RSS feeds for Goodreads user activity and bookshelves.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `goodreads.com/user/show/{id}` | User updates + reviews |
| `goodreads.com/review/list/{id}` | Reviews + user updates |

### GitHub

Discovers Atom feeds for users, organizations, and repositories.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `github.com/{user}` | User activity feed |
| `github.com/{owner}/{repo}` | Releases, commits, tags |
| `github.com/{owner}/{repo}/wiki` | Wiki changes (+ above) |
| `github.com/{owner}/{repo}/discussions` | Discussions (+ above) |
| `github.com/{owner}/{repo}/tree/{branch}` | Branch commits (+ above) |
| `github.com/{owner}/{repo}/blob/{branch}/{path}` | File commits (+ above) |
| `github.com/{owner}/{repo}/commits/{branch}/{path}` | File commits (+ above) |

### GitHub Gist

Discovers Atom feeds for GitHub Gist users and starred gists.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gist.github.com/{username}` | User gists feed |
| `gist.github.com/{username}/{gist-id}` | User gists feed |
| `gist.github.com/{username}/starred` | User starred gists feed |

### Codeberg / Gitea

Discovers RSS feeds for Codeberg and Gitea users, repositories, releases, tags, and branch commits.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `codeberg.org/{user}` | User activity feed |
| `codeberg.org/{user}/{repo}` | Releases, tags, activity |
| `codeberg.org/{user}/{repo}/src/branch/{branch}` | Branch commits (+ above) |
| `codeberg.org/{user}/{repo}/src/branch/{branch}/{path}` | File history (+ above) |

Also supports `gitea.com` with the same patterns.

### GitLab

Discovers Atom feeds for GitLab users, repositories, releases, and tags.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gitlab.com/{user}` | User activity feed |
| `gitlab.com/{user}/{repo}` | Releases, tags, commits |

### Product Hunt

Discovers RSS feeds for Product Hunt homepage, topics, and categories.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `producthunt.com` | Homepage feed |
| `producthunt.com/topics/{topic}` | Topic feed |
| `producthunt.com/categories/{category}` | Category feed |

### Pinterest

Discovers RSS feeds for Pinterest user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pinterest.com/{username}` | User pins feed |

### Dailymotion

Discovers RSS feeds for Dailymotion users and playlists.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dailymotion.com/{username}` | User videos feed |
| `dailymotion.com/playlist/{id}` | Playlist feed |

### DeviantArt

Discovers RSS feeds for DeviantArt user portfolios, gallery folders, favourites, and tags.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `deviantart.com/{username}` | User deviations feed |
| `deviantart.com/{username}/gallery` | User gallery feed |
| `deviantart.com/{username}/gallery/{id}` | Gallery folder feed |
| `deviantart.com/{username}/favourites` | User favourites feed |
| `deviantart.com/tag/{tag}` | Tag feed |

### Bluesky

Discovers RSS feeds for Bluesky profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bsky.app/profile/{handle}` | Profile posts feed |

### Tumblr

Discovers RSS feeds for Tumblr blogs and tagged posts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.tumblr.com` | Blog posts feed |
| `*.tumblr.com/tagged/{tag}` | Tagged posts feed |

### Behance

Discovers RSS feeds for Behance user portfolios and appreciated works.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `behance.net/{username}` | User portfolio feed |
| `behance.net/{username}/appreciated` | User appreciated feed |

### SoundCloud

Discovers RSS feeds for SoundCloud user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `soundcloud.com/{user}` | User sounds feed* |

\* *Requires HTML content to extract user ID.*

### Vimeo

Discovers RSS feeds for Vimeo user profiles, channels, and groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `vimeo.com/{user}` | User videos feed |
| `vimeo.com/{user}/likes` | User likes feed (+ videos) |
| `vimeo.com/channels/{channel}` | Channel feed |
| `vimeo.com/groups/{group}` | Group feed |

### SourceForge

Discovers RSS feeds for SourceForge project activity and file releases.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `sourceforge.net/projects/{project}` | Project activity feed |

### Kickstarter

Discovers Atom feeds for Kickstarter projects and global new projects.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `kickstarter.com` | Global new projects feed |
| `kickstarter.com/discover` | Global new projects feed |
| `kickstarter.com/projects/{creator}/{project}` | Project updates feed |

### Letterboxd

Discovers RSS feeds for Letterboxd user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `letterboxd.com/{username}` | User diary feed |

### Steam

Discovers RSS feeds for Steam game news and community groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `store.steampowered.com/app/{id}` | Game news feed |
| `store.steampowered.com/news/app/{id}` | Game news feed |
| `steamcommunity.com/app/{id}` | Game news feed |
| `steamcommunity.com/groups/{name}` | Group RSS feed |

### Stack Exchange

Discovers RSS feeds for Stack Overflow, Server Fault, Super User, Ask Ubuntu, MathOverflow, Stack Apps, and all `*.stackexchange.com` sites.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/questions/tagged/{tag}` | Tag feed |
| `{site}/questions/{id}` | Question feed |
| `{site}/users/{id}` | User feed |

### Hashnode

Discovers RSS feeds for Hashnode blogs on `*.hashnode.dev`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.hashnode.dev` | Blog feed |

### Paragraph

Discovers RSS feeds for Paragraph blogs (successor to Mirror.xyz).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `paragraph.com/@{username}` | Blog feed |

### Hatena Blog

Discovers RSS and Atom feeds for Hatena Blog on `*.hatenablog.com`, `*.hatenablog.jp`, and `*.hateblo.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.hatenablog.com` | Posts feed (RSS + Atom) |
| `*.hatenablog.jp` | Posts feed (RSS + Atom) |
| `*.hateblo.jp` | Posts feed (RSS + Atom) |
| `*/archive/category/{category}` | Category feed (RSS + Atom) + posts |
| `*/archive/author/{author}` | Author feed (RSS + Atom) + posts |

### Itch.io

Discovers RSS feeds for Itch.io games, creators, devlogs, and browse pages.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{creator}.itch.io/{game}` | Game devlog feed |
| `{creator}.itch.io` | Creator's games feed |
| `itch.io/games` | Games feed |
| `itch.io/games/by-{username}` | Creator's games feed |
| `itch.io/games/tag-{tag}` | Tag feed |
| `itch.io/games/{sort}` | Sorted games feed (newest/top-rated/top-sellers/on-sale) |
| `itch.io/{section}` | Section feed (tools/game-assets/soundtracks/physical-games/books/comics/misc) |
| `itch.io/devlogs` | All devlogs feed |
| `itch.io` | Featured + new + sales feeds |

### CSDN

Discovers RSS feeds for CSDN user blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.csdn.net/{username}` | Blog feed |

### Douban

Discovers RSS feeds for Douban user interests, reviews, notes, and subject reviews.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.douban.com/people/{user}` | Interests + reviews + notes |
| `{subdomain}.douban.com/subject/{id}` | Subject reviews |
| `www.douban.com` | Book + movie + music + drama reviews |

### V2EX

Discovers Atom feeds for V2EX index, nodes, members, and tabs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `v2ex.com` | Index feed |
| `v2ex.com/go/{node}` | Node feed |
| `v2ex.com/member/{username}` | Member feed |
| `v2ex.com/?tab={tab}` | Tab feed |

### Ximalaya

Discovers RSS feeds for Ximalaya podcast albums.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.ximalaya.com/album/{id}` | Album feed |

### Jandan

Discovers RSS feeds for Jandan (煎蛋).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `jandan.net` | Site feed |

## Basic Usage

```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://github.com/feedstand/feedstand', {
  methods: ['platform'],
})

// [
//   { url: 'https://github.com/feedstand/feedstand/releases.atom', ... },
//   { url: 'https://github.com/feedstand/feedstand/commits.atom', ... },
//   { url: 'https://github.com/feedstand/feedstand/tags.atom', ... },
// ]
```

## Configuration

### Handler Order

Handlers are checked in order. The first matching handler generates the feeds:

```typescript
import { githubHandler, youtubeHandler } from 'feedscout/platform'

const feeds = await discoverFeeds(url, {
  methods: {
    platform: {
      handlers: [youtubeHandler, githubHandler, redditHandler],
    },
  },
})
```

## Default Values

Import the default Platform options:

```typescript
import { defaultPlatformOptions } from 'feedscout/platform'
```

Or import individual handlers:

```typescript
import {
  behanceHandler,
  blogspotHandler,
  blueskyHandler,
  codebergHandler,
  csdnHandler,
  dailymotionHandler,
  deviantartHandler,
  devtoHandler,
  doubanHandler,
  goodreadsHandler,
  githubGistHandler,
  githubHandler,
  gitlabHandler,
  hashnodeHandler,
  hatenablogHandler,
  itchioHandler,
  jandanHandler,
  kickstarterHandler,
  letterboxdHandler,
  lobstersHandler,
  mediumHandler,
  paragraphHandler,
  producthuntHandler,
  redditHandler,
  soundcloudHandler,
  sourceforgeHandler,
  stackExchangeHandler,
  steamHandler,
  substackHandler,
  tumblrHandler,
  v2exHandler,
  vimeoHandler,
  wordpressHandler,
  wpengineHandler,
  ximalayaHandler,
  youtubeHandler,
} from 'feedscout/platform'
```

## Using Directly

Use the Platform discovery function directly to get URIs without validation:

```typescript
import { discoverUrisFromPlatform } from 'feedscout/platform'

const uris = discoverUrisFromPlatform(htmlContent, {
  baseUrl: 'https://www.youtube.com/@mkbhd',
  handlers: [youtubeHandler],
})

// [
//   {
//     uri: [
//       'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ',
//       'https://www.youtube.com/feeds/videos.xml?playlist_id=UUBJycsmduvYEL83R_U4JriQ',
//     ],
//     hint: { key: 'youtube:all', label: 'All uploads' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULFBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:videos', label: 'Videos only' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUSHBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:shorts', label: 'Shorts only' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:live', label: 'Live streams only' },
//   },
// ]
```

> [!NOTE]
> The YouTube handler requires HTML content for `@handle`, `/user/`, and `/c/` URLs to extract the channel ID. For `/channel/UC...` URLs, no content is needed.

## Creating Custom Handlers

You can create handlers for platforms not included by default.

### Handler Interface

A `PlatformHandler` has two methods:

```typescript
type PlatformHandler = {
  match: (url: string) => boolean
  resolve: (url: string, content?: string) => Array<DiscoverUriEntry>
}
```

| Method | Description |
|--------|-------------|
| `match(url)` | Returns `true` if this handler should process the URL |
| `resolve(url, content?)` | Returns an array of [`DiscoverUriEntry`](/reference/types#discoverurientry) objects for the given page URL |

### Basic Example

A handler that appends `/feed.xml` to any URL on a specific domain:

```typescript
import type { PlatformHandler } from 'feedscout/platform'

const myHandler: PlatformHandler = {
  match: (url) => {
    return new URL(url).hostname === 'example.com'
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed.xml` }]
  },
}
```

### Using URL Patterns

A handler that extracts a username from the URL path:

```typescript
const profileHandler: PlatformHandler = {
  match: (url) => {
    const { hostname, pathname } = new URL(url)

    return hostname === 'example.com' && pathname.startsWith('/users/')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const match = pathname.match(/^\/users\/([^/]+)/)

    if (match?.[1]) {
      return [{ uri: `${origin}/users/${match[1]}/feed.rss` }]
    }

    return []
  },
}
```

### Using Page Content

When feed URLs can only be found in the HTML, use the `content` parameter:

```typescript
const contentHandler: PlatformHandler = {
  match: (url) => new URL(url).hostname === 'example.com',

  resolve: (url, content) => {
    if (!content) {
      return []
    }

    const match = content.match(/data-feed-url="([^"]+)"/)

    return match?.[1] ? [{ uri: match[1] }] : []
  },
}
```

### Combining with Defaults

Add custom handlers alongside the built-in ones:

```typescript
import { defaultPlatformOptions } from 'feedscout/platform'

const feeds = await discoverFeeds(url, {
  methods: {
    platform: {
      handlers: [myHandler, ...defaultPlatformOptions.handlers],
    },
  },
})
```
