---
title: "Discover Feeds: Platform Method"
---

# Platform Method

The Platform method generates feed URLs for known platforms using URL pattern matching. Most handlers work from the URL alone by recognizing URL structures specific to each platform. Some also read the page content or response headers to detect self-hosted instances or to extract an ID.

## How It Works

The Platform method uses handlers for each supported platform:

1. **Pattern Matching**: Each handler checks if the URL matches its platform (e.g., `github.com`, `youtube.com`).
2. **URL Generation**: The matching handler generates feed URLs based on the URL structure.
3. **First Match**: The first matching handler that generates feeds wins. Subsequent handlers are skipped. A handler that matches but generates nothing passes the page to the next one.

> [!TIP]
> Even when feeds are discoverable via HTML `<link>` tags, the Platform method is useful because it generates feed variants the page does not advertise, like a channel's Shorts feed or a repository's releases feed. Handlers that work from the URL alone need no page content, which helps when you [use the method directly](#using-directly) and only have a URL.

## Hints

Platform handlers attach a `hint` to each feed URI they generate. Hints provide a machine-readable `key` and a human-readable `label` that describe what type of feed the URI represents (e.g., "All uploads", "Videos", "Shorts"). This is useful when a single URL generates multiple feed variants and you need to let users pick the right one, especially for feeds that don't include a descriptive title.

Hints are propagated to the final [`DiscoverResult`](/reference/types#discoverresult) objects returned by `discoverFeeds`. Results from non-platform methods (HTML, headers, guess) do not include hints.

When a platform serves the same feed in several formats, like WordPress posts in RSS, Atom and RDF, each variant gets the same `label` and its own `format`. The hint carries the format the platform serves at that URL, so it is there for results that failed to validate too.

```typescript
type DiscoverUriHint = {
  key: string                              // e.g., 'youtube:all', 'wordpress:posts'
  label: string                            // e.g., 'All uploads', 'Posts'
  format?: 'rss' | 'atom' | 'rdf' | 'json' // e.g., 'atom'
}
```

## Supported Platforms

### Apple Podcasts

Discovers RSS feeds for Apple Podcasts shows by extracting the feed URL from the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `podcasts.apple.com/{locale}/podcast/{name}/id{id}` | Podcast feed* |

\* *Requires HTML content to extract feed URL.*

### YouTube

Discovers Atom feeds for channels and playlists. Generates ten feed variants for channels: all uploads, then videos, shorts and live streams, each also as a popular and a members-only feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `youtube.com/channel/{id}` | All channel feed variants |
| `youtube.com/@{handle}` | All channel feed variants* |
| `youtube.com/user/{name}` | All channel feed variants* |
| `youtube.com/c/{custom}` | All channel feed variants* |
| `youtube.com/watch?v={id}` | All channel feed variants* |
| `youtu.be/{id}` | All channel feed variants* |
| `youtube.com/shorts/{id}` | All channel feed variants* |
| `youtube.com/live/{id}` | All channel feed variants* |
| `youtube.com/playlist?list={id}` | Playlist feed |

\* *Requires HTML content to extract channel ID.*

### Reddit

Discovers Atom feeds for subreddits, users, multireddits, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `reddit.com` | Homepage feed |
| `reddit.com/r/{subreddit}` | Subreddit posts + comments |
| `reddit.com/r/{subreddit}/{sort}` | Sorted posts (hot/new/rising/top) + comments |
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
| `medium.com/tag/{tag}` | Tag feed |
| `medium.com/{publication}/tagged/{tag}` | Tagged publication feed |
| `*.medium.com` | Subdomain publication feed |
| `*.medium.com/tagged/{tag}` | Subdomain tagged feed |

### Substack

Discovers RSS feeds for Substack newsletters.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.substack.com` | Newsletter feed |
| `substack.com/@{user}` | Newsletter feed* |

\* *The publication can differ from the handle and can sit on a custom domain. It is read from the page content when available, with the handle as the fallback.*

### WordPress.com

Discovers RSS and Atom feeds for WordPress.com and Unblog blogs, with category, tag, and author support.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.wordpress.com` | Posts feed (RSS + Atom + RDF) + comments |
| `*.wordpress.com/category/{category}` | Category feed (+ above) |
| `*.wordpress.com/category/{parent}/{category}` | Nested category feed (+ above) |
| `*.wordpress.com/tag/{tag}` | Tag feed (+ above) |
| `*.wordpress.com/author/{author}` | Author feed (+ above) |
| `*.unblog.fr` | Same as `*.wordpress.com` (Unblog) |
| `*.hypotheses.org` | Same as `*.wordpress.com` |
| `*.hypotheses.org/{post_id}` | Post comments feed (+ above) |

### WP Engine

Discovers feeds for WP Engine-hosted WordPress sites. Uses the same feed structure as [WordPress.com](#wordpress-com).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.wpenginepowered.com` | Same as WordPress.com |
| `*.wpengine.com` | Same as WordPress.com (legacy domain) |

### Blogspot

Discovers RSS and Atom feeds for Blogspot blogs, including label, comments, summary, and per-post comments feeds. Also matches country-coded TLDs (`*.blogspot.co.uk`, `*.blogspot.de`, etc.), and Blogger blogs on custom domains, detected by the `www.blogger.com/static/v1/widgets/` assets every Blogger page loads.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blogspot.com` | Posts feed (Atom + RSS) + summary (Atom + RSS) + comments (Atom + RSS) |
| `*.blogspot.com/search/label/{label}` | Label feed (Atom + RSS) + above |
| `*.blogspot.com/{year}/{month}/{slug}.html` | Post comments feed (Atom + RSS)* + above |
| Custom domain, any of the paths above | Same as on `*.blogspot.com` |

\* *Requires HTML content to extract the post ID.*

### DEV.to

Discovers RSS feeds for DEV.to user profiles, tags, the global community, and the latest sort.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dev.to` | Community feed |
| `dev.to/latest` | Latest sort feed + community feed |
| `dev.to/{username}` | User or organization posts feed |
| `dev.to/{username}/{article}` | Author's posts feed |
| `dev.to/t/{tag}` | Tag posts feed |

### Lobsters

Discovers RSS feeds for Lobsters homepage, users, tags, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `lobste.rs` | Homepage feed + site-wide comments feed |
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
| `github.com/{user}`, `github.com/{user}.atom` or `github.com/{user}.png` | User activity feed |
| `github.com/orgs/{org}/discussions` | Organization discussions |
| `github.com/orgs/{org}/discussions/categories/{category}` | Discussion category (+ above) |
| `github.com/{owner}/{repo}` | Releases, commits, tags |
| `github.com/{owner}/{repo}/wiki` | Wiki changes (+ above) |
| `github.com/{owner}/{repo}/discussions` | Discussions (+ above) |
| `github.com/{owner}/{repo}/discussions/categories/{category}` | Discussion category (+ above) |
| `github.com/{owner}/{repo}/tree/{branch}` | Branch commits (+ above) |
| `github.com/{owner}/{repo}/blob/{branch}/{path}` | File commits (+ above) |
| `github.com/{owner}/{repo}/commits/{branch}/{path}` | File commits (+ above) |

### GitHub Gist

Discovers Atom feeds for GitHub Gist users, starred gists, forked gists, and the discover stream.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gist.github.com/{username}` | User gists feed |
| `gist.github.com/{username}/{gist-id}` | User gists feed |
| `gist.github.com/{username}/public` or `/secret` | User gists feed |
| `gist.github.com/{username}/starred` or `/starred.atom` | User starred gists feed |
| `gist.github.com/{username}/forks` or `/forked` | User forked gists feed |
| `gist.github.com/discover` | Discover gists feed |

### Gitea

Discovers Atom feeds for Gitea users, repositories, releases, tags, branch commits and file history, with RSS as the fallback. Codeberg and `gitea.com` are matched by host; any other instance is matched by the session cookie Gitea sets on a repository page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{user}`, `{instance}/{user}.rss`, `.atom` or `.keys` | User activity feed |
| `{instance}/{user}/{repo}` | Releases, tags, activity |
| `{instance}/{user}/{repo}/src/branch/{branch}` | Branch commits (+ above) |
| `{instance}/{user}/{repo}/src/branch/{branch}/{path}` | File history (+ above) |
| `{instance}/{user}/{repo}/commits/branch/{branch}` | Branch commits (+ above) |
| `{instance}/{user}/{repo}/commits/branch/{branch}/{path}` | File history (+ above) |

> [!NOTE]
> A self-hosted Forgejo instance sets no cookie on an anonymous request and is not matched; Codeberg, which runs Forgejo, is covered by the host list. `gitea.com` sends anonymous visitors of branch, file and commit history pages to its sign-in page, so discovery from those pages finds no feeds there.

### GitLab

Discovers Atom feeds for GitLab users and repositories. Self-hosted instances are detected via the `og:site_name` HTML meta tag or the `X-Gitlab-Meta` response header, on project paths only: `/{group}/{project}` or any path containing `/-/`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gitlab.com/{user}` or `gitlab.com/{user}.atom` | User activity feed |
| `gitlab.com/{project}` | Releases, tags, issues, merge requests, activity |
| `gitlab.com/{project}/-/commits/{branch}` | Branch commits feed (+ above) |
| `gitlab.com/{project}/-/tree/{branch}` | Branch commits feed (+ above) |

> `{project}` is the full path and can be any depth, because groups nest: `group/subgroup/project` is one project. GitLab puts `/-/` between the project path and the feature path, which is where the split happens.

### Product Hunt

Discovers the Atom feed for Product Hunt.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `producthunt.com` | Products feed (Atom) |

> There is one feed. Topic and category pages have no feed of their own, and the `?topic=` and `?category=` parameters are ignored.

### Pinboard

Discovers RSS feeds for Pinboard users, user tags, and the popular and recent lists.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pinboard.in` | Popular bookmarks feed |
| `pinboard.in/popular` | Popular bookmarks feed |
| `pinboard.in/recent` | Recent bookmarks feed |
| `pinboard.in/u:{username}` | User bookmarks feed |
| `pinboard.in/u:{username}/t:{tag}` | User tag feed |
| `pinboard.in/u:{username}/t:{tag1}/t:{tag2}` | User multi-tag feed |
| `pinboard.in/t:{tag}` | Site-wide tag feed |

### Pinterest

Discovers RSS feeds for Pinterest user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pinterest.com/{username}` | User pins feed |

### Dailymotion

Discovers RSS feeds for Dailymotion users, playlists, channels, and the global trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dailymotion.com/{username}` | User videos feed |
| `dailymotion.com/playlist/{id}` | Playlist feed |
| `dailymotion.com/channel/{name}` | Channel feed |
| `dailymotion.com` or `dailymotion.com/trending` | Trending feed |

### DeviantArt

Discovers RSS feeds for DeviantArt user portfolios, gallery folders, favourites, and tags.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `deviantart.com/{username}` | User deviations feed |
| `deviantart.com/{username}/gallery` | User gallery feed |
| `deviantart.com/{username}/gallery/{id}` | Gallery folder feed |
| `deviantart.com/{username}/favourites` | User favourites feed |
| `deviantart.com/tag/{tag}` | Tag feed |

### Mastodon

Discovers RSS feeds for Mastodon user profiles and hashtag pages. Detects Mastodon instances via the `<meta name="generator">` HTML tag, the `<div id="mastodon">` app root or the `Server` response header. There is no hardcoded instance list.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{username}` or `{instance}/users/{username}` | User posts feed |
| `{instance}/@{username}/tagged/{tag}` | User posts tagged feed + posts |
| `{instance}/@{username}/with_replies` | User posts with replies feed + posts |
| `{instance}/@{username}/media` | User media-only feed + posts |
| `{instance}/tags/{tag}` | Hashtag feed |

> [!NOTE]
> Requires page content or response headers to detect Mastodon instances. Works with any Mastodon-compatible server, not just well-known instances.

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
| `www.tumblr.com/{blog}` | Blog posts feed |

### Behance

Discovers RSS feeds for Behance user portfolios, plus the homepage Featured-projects feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `behance.net` or `behance.net/galleries` | Featured projects |
| `behance.net/{username}` | User portfolio feed |
| `behance.net/{username}/appreciated` | User portfolio feed* |

\* *Behance ignores `content=appreciated` and serves the user's own projects, so the appreciated page gets the portfolio feed.*

### SoundCloud

Discovers RSS feeds for SoundCloud user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `soundcloud.com/{user}` | User sounds feed* |

\* *Requires HTML content to extract user ID.*

### Vimeo

Discovers RSS feeds for Vimeo user profiles, channels, groups, and albums (showcases).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `vimeo.com/{user}` | User videos feed |
| `vimeo.com/{user}/likes` | User likes feed (+ videos) |
| `vimeo.com/channels/{channel}` | Channel feed |
| `vimeo.com/groups/{group}` | Group feed |
| `vimeo.com/album/{id}` | Album/showcase feed |

### SourceForge

Discovers RSS feeds for SourceForge project activity, file releases, news, and discussion.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `sourceforge.net/projects/{project}` or `sourceforge.net/p/{project}` | Activity + project + files + news (RSS + Atom) + discussion (RSS + Atom) + bugs |

### Kickstarter

Discovers Atom feeds for Kickstarter projects and global new projects.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `kickstarter.com` | Global new projects feed |
| `kickstarter.com/discover` | Global new projects feed |
| `kickstarter.com/projects/{creator}/{project}` | Project updates feed |

### Launchpad

Discovers the Atom feeds Launchpad serves on `feeds.launchpad.net` for projects, distributions, people, teams, bugs and Bazaar branches. The `bugs.` and `code.` subdomains get the feeds of their own section.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `launchpad.net` | Announcements feed |
| `bugs.launchpad.net` | Latest bugs feed |
| `launchpad.net/{project}` | Announcements + latest bugs + branches + revisions feeds |
| `bugs.launchpad.net/{project}` | Latest bugs feed |
| `code.launchpad.net/{project}` | Branches + revisions feeds |
| `launchpad.net/~{user}` | Latest bugs + branches + revisions feeds |
| `bugs.launchpad.net/~{user}` | Latest bugs feed |
| `code.launchpad.net/~{user}` | Branches + revisions feeds |
| `bugs.launchpad.net/{distro}/+source/{package}` | Package latest bugs feed |
| `bugs.launchpad.net/{project}/+bug/{id}` or `bugs.launchpad.net/bugs/{id}` | Bug feed |
| `code.launchpad.net/~{user}/{project}/{branch}` | Branch feed |

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
| `store.steampowered.com/newshub/app/{id}` | Game news feed |
| `steamcommunity.com/app/{id}` | Game news feed |
| `steamcommunity.com/groups/{name}` | Group RSS feed |

### Stack Exchange

Discovers Atom feeds for Stack Overflow, Server Fault, Super User, Ask Ubuntu, MathOverflow, Stack Apps, and all `*.stackexchange.com` sites.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}` | Site-wide newest questions feed |
| `{site}/questions/tagged/{tag}` | Tag feed |
| `{site}/questions/{id}` | Question feed |
| `{site}/users/{id}` | User feed |
| `{site}/collectives/{name}` | Collective feed |

> [!NOTE]
> Tag feeds accept `?sort={newest|active|votes|creation|hot|week|month}` (also `?tab=…`). The value is passed through to the generated feed URL when it matches one of the allowed sorts. Unknown values are silently dropped.

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

### Hatena Antenna

Discovers RSS feeds for Hatena Antenna users and their groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `a.hatena.ne.jp/{user}` | Antenna feed |
| `a.hatena.ne.jp/{user}/?gid={group}` | Group feed |

> A group id the user does not have falls back to the antenna feed, since Hatena serves an empty feed under any made-up group id. A real group with no updated page keeps its own feed.

### Hatena Bookmark

Discovers RSS feeds for Hatena Bookmark listings, searches, sites and user bookmarks.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `b.hatena.ne.jp` | Hot entries feed |
| `b.hatena.ne.jp/hotentry/{category}` | Hot entries by category |
| `b.hatena.ne.jp/entrylist/{category}` | New entries by category |
| `b.hatena.ne.jp/search/{tag\|text\|title}?q={query}` | Search feed |
| `b.hatena.ne.jp/site/{domain}` | Site bookmarks feed |
| `b.hatena.ne.jp/{user}` | User bookmarks feed |

> Categories are `it`, `general`, `social`, `economics`, `life`, `knowledge`, `fun`, `entertainment` and `game`. Search and site feeds keep any filters already on the URL and add `mode=rss`.

### Hatena Fotolife

Discovers RSS feeds for Hatena Fotolife users, folders, tags, camera models and stars.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `f.hatena.ne.jp/{user}` | Photos feed |
| `f.hatena.ne.jp/{user}?model={model}` | Camera model feed |
| `f.hatena.ne.jp/{user}/{folder}/` | Folder feed |
| `f.hatena.ne.jp/{user}/t/{tag}` | Tag feed |
| `f.hatena.ne.jp/{user}/favorite` | Stars feed |
| `f.hatena.ne.jp/{user}/starfriends` | Star Friends feed |

> A folder, tag or camera model page that lists no photo falls back to the user's photos feed, since Hatena serves an empty feed under any made-up name.

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
| `itch.io/games` or `/games.xml` | Games feed |
| `itch.io/games/by-{username}` or `/by-{username}.xml` | Creator's games feed |
| `itch.io/games/tag-{tag}` or `/tag-{tag}.xml` | Tag feed |
| `itch.io/games/platform-{platform}` or `/platform-{platform}.xml` | Platform feed |
| `itch.io/games/genre-{genre}` or `/genre-{genre}.xml` | Genre feed |
| `itch.io/games/made-with-{engine}` or `/made-with-{engine}.xml` | Engine feed |
| `itch.io/games/{sort}` or `/{sort}.xml` | Sorted games feed (newest/top-rated/top-sellers/on-sale/free/released/in-development) |
| `itch.io/{section}` or `/{section}.xml` | Section feed (tools/game-assets/soundtracks/physical-games/books/comics/misc) |
| `itch.io/devlogs` or `/devlogs.xml` | All devlogs feed |
| `itch.io` | Featured + new + sales + all devlogs feeds + itch.io blog |
| `itch.io/feed/{feed}.xml` | Curated feed (featured/new/sales) |
| `itch.io/blog` or `itch.io/blog.rss` | itch.io blog |

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
| `v2ex.com/?tab={tab}` | Tab feed + index feed |

### Ximalaya

Discovers RSS feeds for Ximalaya podcast albums.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.ximalaya.com/album/{id}` | Album feed |

### Write.as

Discovers RSS feeds for Write.as blogs, including tag feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `write.as/{user}` | Blog feed |
| `write.as/{user}/tag:{tag}` | Tag feed + blog |
### Prose.sh

Discovers Atom feeds for Prose.sh blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.prose.sh` | Blog feed |
### Pagecord

Discovers RSS feeds for Pagecord blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.pagecord.com` | Blog feed |
### ArtStation

Discovers RSS feeds for ArtStation portfolios and the global artwork feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `artstation.com/{user}` | Portfolio feed |
| `{user}.artstation.com` | Portfolio feed |
| `artstation.com/artwork` | Artwork + Artwork (Latest) |

> `?sorting=trending` is the feed default and returns the same items as the bare URL, so only `?sorting=latest` is emitted alongside it.

### Bear Blog

Discovers Atom and RSS feeds for Bear Blog, including tag-filtered feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.bearblog.dev` | Posts feed (Atom + RSS) |
| `*.bearblog.dev/?q={tag}` | Tag feed (Atom + RSS) + posts |

### Buttondown

Discovers RSS feeds for Buttondown newsletters.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `buttondown.com/{user}` | Newsletter feed |

### Dreamwidth

Discovers RSS and Atom feeds for Dreamwidth blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.dreamwidth.org` | Posts feed (RSS + Atom) + userpics (Atom) |

### Excite Blog

Discovers RSS and Atom feeds for Excite Blog, including category feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.exblog.jp` | Posts feed (RSS + Atom) |
| `{blog}.exblog.jp/i{N}` | Category feed (RSS + Atom) + posts |

### Fireside.fm

Discovers RSS and JSON feeds for Fireside.fm-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.fireside.fm` | Podcast feed (RSS + JSON) |

### Firstory

Discovers the RSS feed of a Firstory podcast. The feed is keyed by the show's ID, which the handler reads from the page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `open.firstory.fm/user/{show}` | Podcast feed (RSS) |
| `open.firstory.fm/story/{episodeId}` | Podcast feed (RSS) |
| `{show}.firstory.cc` | Podcast feed (RSS) |
| `{show}.firstory.cc/episodes/{episodeId}` | Podcast feed (RSS) |

### Hacker News

Discovers RSS feeds for Hacker News.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `news.ycombinator.com` | Front page feed (RSS) |
| `news.ycombinator.com/show` | Show HN feed (RSS) |

### Listed

Discovers RSS feeds for Listed (Standard Notes) blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `listed.to/@{user}` | Blog feed |

### MyAnimeList

Discovers RSS feeds for MyAnimeList user lists and site-wide news.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `myanimelist.net/profile/{user}` | Anime list, Manga list, Recently watched, Recently read, Blog (RSS) |
| `myanimelist.net/animelist/{user}` | (same as above) |
| `myanimelist.net/mangalist/{user}` | (same as above) |
| `myanimelist.net/history/{user}` | (same as above) |
| `myanimelist.net/news` | Site-wide news feed |

### Nebula

Discovers RSS feeds for Nebula channels, the global video feed, and category feeds, each with a Plus-only variant.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `nebula.tv/{channel}` | Videos + Videos (Plus) |
| `nebula.tv` | All videos + All videos (Plus) + Nebula Originals + recently added channels |
| `nebula.tv/videos` | All videos + All videos (Plus) + Nebula Originals + recently added channels |
| `nebula.tv/videos?category={slug}` | Category + Category (Plus) + above |

### note.com

Discovers RSS feeds for note.com, including hashtag and magazine feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `note.com/{user}` | Blog feed |
| `note.com/hashtag/{tag}` or `note.com/tag/{tag}` | Hashtag feed |
| `note.com/{user}/m/{magazineId}` | Magazine feed |

### Odysee

Discovers RSS feeds for Odysee channels.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `odysee.com/@{channel}:{id}` | Videos feed |

### Tistory

Discovers RSS feeds for Tistory blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.tistory.com` | Blog feed |

### Transistor

Discovers RSS feeds for Transistor-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.transistor.fm` | Podcast feed* |

\* *The feed slug can differ from the subdomain. It is read from the page content when available, with the subdomain as the fallback.*

### Velog

Discovers RSS feeds for Velog users and the platform-wide trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `velog.io/@{user}` | Posts feed |
| `velog.io` | Trending posts feed |

### Acast

Discovers RSS feeds for Acast-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `shows.acast.com/{slug}` | Podcast feed (RSS) |

### Ameba Blog

Discovers RSS, Atom, and RDF feeds for Ameba Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `ameblo.jp/{user}` | Posts feed (RSS + Atom + RDF) |

### Are.na

Discovers RSS feeds for Are.na user profiles and channels.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `are.na/{user}` | User profile feed |
| `are.na/{user}/{channel}` | Channel feed |

### Audioboom

Discovers RSS feeds for Audioboom channels.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `audioboom.com/channels/{id}` | Podcast feed (RSS) |

### Ausha

Discovers the RSS feed of an Ausha show by reading its feed id from the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `podcast.ausha.co/{show}` | Podcast feed (RSS)* |
| `podcast.ausha.co/{show}/{episode}` | Podcast feed (RSS)* |
| `smartlink.ausha.co/{show}` | Podcast feed (RSS)* |
| `smartlink.ausha.co/{show}/{episode}` | Podcast feed (RSS)* |

\* *Requires HTML content to extract the feed id.*

### BookWyrm

Discovers RSS feeds for BookWyrm user activity, reviews, quotes, comments, and per-shelf feeds. Detected by the link to the BookWyrm source code in the page footer, or by the `BookWyrm` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/user/{user}` | Activity + reviews + quotes + comments (RSS) |
| `{instance}/user/{user}/(shelf\|books)/{shelf-id}` | Shelf feed (RSS) + activity/reviews/quotes/comments |

### Buzzsprout

Discovers RSS feeds for Buzzsprout-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `buzzsprout.com/{id}` | Podcast feed |

### CANPAN Blog

Discovers RSS 2.0 and RDF feeds for CANPAN Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.canpan.info/{blog}` | Posts feed (RSS 2.0 + RDF) |

### Canalblog

Discovers RSS feeds for Canalblog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.canalblog.com` | Posts feed |

### Captivate

Discovers RSS feeds for Captivate-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.captivate.fm` | Podcast feed (RSS) |

### Castopod

Discovers the RSS feed of a podcast hosted on a Castopod instance. Detected by the theme colors stylesheet that Castopod prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{handle}` | Podcast feed (RSS) |
| `{instance}/@{handle}/episodes/{slug}` | Podcast feed (RSS) |

### Castos

Discovers RSS feeds for podcasts with a Castos-hosted website.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.castos.com` | Podcast feed (RSS) |

### Discourse

Discovers RSS feeds for Discourse forums. Detected by the `Discourse` generator meta tag, the `data-discourse-setup` meta tag or the `X-Discourse-Route` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/u/{user}` | User activity feed (RSS) |
| `{instance}/c/{slug}` | Category feed (RSS) |
| `{instance}/t/{slug}/{id}` | Topic feed (RSS) |
| `{instance}/top` or `/top/{period}` | Top topics feed (RSS) |
| `{instance}/` (or any other path) | Latest topics feed + latest posts feed (RSS) |

> [!NOTE]
> The top topics feed accepts `{daily|weekly|monthly|quarterly|yearly|all}` via either the `/top/{period}` path or `?period={period}` query param. An unknown path period falls back to the query param, and an unknown value in both is dropped.

### Flickr

Discovers Atom feeds for Flickr photostreams, favorites, tags, groups and the help forum.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `flickr.com/photos/tags/{tag}` | Tag feed |
| `flickr.com/photos/{nsid}` | Photostream feed |
| `flickr.com/photos/{nsid}/favorites` | Favorites feed |
| `flickr.com/groups/{nsid}` | Group pool + discussions + pool with location feeds |
| `flickr.com/groups/{nsid}/pool` | Group pool + pool with location feeds |
| `flickr.com/groups/{nsid}/discuss` | Group discussions feed |
| `flickr.com/help/forum` | Forum feed |

> The photo and group feeds take an NSID such as `24662369@N07`, never a vanity alias: `photos_public.gne?id={alias}` answers 404. A URL carrying an alias is left to the other methods, and the page itself links the right feed.

### Friendica

Discovers Atom feeds for Friendica user profiles. Detected by the `Friendica` generator meta tag or the `X-Friendica-Version` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/profile/{user}` | Posts + comments + replies + activity feeds (Atom) |

### Ghost

Discovers RSS feeds for Ghost-hosted blogs, including tag and author feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.ghost.io` | Blog feed |
| `*.ghost.io/tag/{slug}` | Tag feed + blog |
| `*.ghost.io/author/{slug}` | Author feed + blog |

### Hearthis.at

Discovers RSS feeds for Hearthis.at user profiles, plus the site-wide new tracks feed every page links.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `hearthis.at/{user}` | Tracks feed + new tracks feed |

### HEY World

Discovers Atom feeds for HEY World blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `world.hey.com/{user}` | Blog feed |

### InsaneJournal

Discovers RSS and Atom feeds for InsaneJournal journals.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.insanejournal.com` | Posts feed (RSS + Atom) + userpics (Atom) |

### JUGEM

Discovers RSS 1.0 and Atom feeds for JUGEM blogs. A blog on a custom domain is detected by `imaging.jugem.jp` assets or the `./template/js/cookie.js` script.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.jugem.jp` | Posts feed (RSS 1.0 + Atom) |
| `{blog}.jugem.cc` | Posts feed (RSS 1.0 + Atom) |
| Any page on a custom domain | Posts feed (RSS 1.0 + Atom) |

### Lemmy

Discovers RSS feeds for Lemmy instances, communities and users. Detected by the `lemmy-site` app root, the `Lemmy` generator meta tag or the `X-Powered-By` response header. There is no hardcoded instance list.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/` | All posts feed + local posts feed |
| `{instance}/c/{community}` | Community feed |
| `{instance}/u/{user}` | User feed |

> [!NOTE]
> Requires page content or response headers to detect Lemmy instances. The `?sort=` and `?limit=` query params are passed through to the generated feed URL. Unknown sort values are silently dropped. When the page URL has no valid sort, the feed takes the sort the page advertises.

### Libsyn

Discovers RSS feeds for Libsyn-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{slug}.libsyn.com` | Podcast feed |
| `feeds.libsyn.com/{showId}` | Podcast feed |

### Livedoor Blog

Discovers RDF and Atom feeds for Livedoor Blog on `*.blog.jp`, `*.doorblog.jp`, `*.ldblog.jp`, and `*.livedoor.biz`, including category feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blog.jp` | Posts feed (RDF + Atom) |
| `{blog}.blog.jp/archives/cat_{N}.html` | Category feed (RDF) + posts |
| `{blog}.doorblog.jp` | Posts feed (RDF + Atom) |
| `{blog}.doorblog.jp/archives/cat_{N}.html` | Category feed (RDF) + posts |
| `{blog}.ldblog.jp` | Posts feed (RDF + Atom) |
| `{blog}.ldblog.jp/archives/cat_{N}.html` | Category feed (RDF) + posts |
| `{blog}.livedoor.biz` | Posts feed (RDF + Atom) |
| `{blog}.livedoor.biz/archives/cat_{N}.html` | Category feed (RDF) + posts |

### LiveJournal

Discovers RSS and Atom feeds for LiveJournal blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.livejournal.com` | Posts feed (RSS + Atom) + userpics (Atom) |

### Mataroa

Discovers RSS feeds for Mataroa blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.mataroa.blog` | Blog feed |

### Megaphone

Discovers RSS feeds for Megaphone-hosted podcasts from their embed players.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `playlist.megaphone.fm/?p={id}` | Podcast feed |
| `player.megaphone.fm/{episode}` | Podcast feed (read from the page) |

### Micro.blog

Discovers RSS, JSON, and podcast feeds for Micro.blog-hosted blogs, including category, archive, photos, and replies feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.micro.blog` | Posts (RSS + JSON) + podcast (RSS + JSON) |
| `*.micro.blog/categories/{slug}` | Category (RSS + JSON) + above |
| `*.micro.blog/archive` | Archive feed + above |
| `*.micro.blog/photos` | Photos feed + above |
| `*.micro.blog/replies` | Replies feed + above |

### Misskey

Discovers Atom, RSS, and JSON feeds for Misskey and Sharkey user profiles. Detected by the `Misskey` or `Sharkey` application-name meta tag, or the `misskey_meta` script tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{user}` | Posts feed (Atom + RSS + JSON) |

### Naver Blog

Discovers RSS feeds for Naver Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.naver.com/{id}` | Blog feed |
| `m.blog.naver.com/{id}` | Blog feed |

### Observable

Discovers RSS feeds for Observable user notebooks and collections.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `observablehq.com/@{user}` | Notebooks feed |
| `observablehq.com/@{user}/collection/{slug}` or `/@{user}/-/collection/{slug}` | Collection feed |
| `observablehq.com/recent` or `/public?sort=publish_time` | Recent feed |
| `observablehq.com/trending` or `/public` | Trending feed |

### Pika

Discovers Atom and RSS feeds for Pika blogs, including tag feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.pika.page` | Posts feed (Atom + RSS) |
| `*.pika.page/tag/{tag}` | Tag feed (Atom + RSS) + posts |

### Pixelfed

Discovers Atom feeds for Pixelfed user profiles. Detected by the `pixelfed` generator meta tag or the `Pixelfed` application-name meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{user}` or `{instance}/users/{user}` | Posts feed (Atom) |

### Pleroma

Discovers Atom and RSS feeds for Pleroma (and Akkoma) user profiles. Detected by Pleroma-specific API endpoint references in HTML.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/users/{user}` | Posts feed (Atom + RSS) |

### Podbean

Discovers RSS feeds for Podbean-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.podbean.com` | Podcast feed |

### Podhome

Discovers the RSS feed of a Podhome show, on `serve.podhome.fm` or a custom domain. Detected by the show site's assets on `cdn.podhome.fm`, and the feed is read from the page, since its URL carries an ID the page URL does not.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `serve.podhome.fm/{show}` | Podcast feed (RSS) |
| `serve.podhome.fm/episodepage/{show}/{episode}` | Podcast feed (RSS) |
| Any page of a show on a custom domain | Podcast feed (RSS) |

### Podigee

Discovers RSS feeds for Podigee-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.podigee.io` | Podcast feed (RSS) |

### Postach.io

Discovers Atom feeds for Postach.io sites.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.postach.io` | Posts feed (Atom) |

### Posthaven

Discovers Atom feeds for Posthaven blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.posthaven.com` | Posts feed (Atom) |

### Qiita

Discovers Atom feeds for Qiita users, tags, organizations, and popular items.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `qiita.com/{user}` | User posts feed |
| `qiita.com/tags/{tag}` | Tag feed |
| `qiita.com/organizations/{org}` | Organization feed |
| `qiita.com/popular-items` | Popular items feed |

### RSS.com

Discovers RSS feeds for RSS.com-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `rss.com/podcasts/{slug}` | Podcast feed |

### RubyGems

Discovers Atom feeds for RubyGems.org gems and the site-wide latest gems.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `rubygems.org/gems/{name}` | Gem versions feed (Atom) |
| `rubygems.org` | Latest gems feed (Atom) |

> Every page links the latest gems feed through a FeedBurner address that now serves HTML, so the handler emits the rubygems.org copy.

### Sakura blog

Discovers RSS 2.0 and RDF feeds for Sakura blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.sblo.jp` | Posts feed (RSS 2.0 + RDF) |

### Seesaa Blog

Discovers RSS 2.0 and RDF feeds for Seesaa Blog on `*.seesaa.net` and its other blog domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.seesaa.net` | Posts feed (RSS 2.0 + RDF) |
| `*.iiblog.jp` | Posts feed (RSS 2.0 + RDF) |
| `*.seesaa.blog` | Posts feed (RSS 2.0 + RDF) |
| `*.seesaa.space` | Posts feed (RSS 2.0 + RDF) |
| `*.sokuho.org` | Posts feed (RSS 2.0 + RDF) |
| `*.stablo.jp` | Posts feed (RSS 2.0 + RDF) |
| `*.xblog.jp` | Posts feed (RSS 2.0 + RDF) |

### Sermon.net

Discovers the audio podcast feed of every channel a church page lists, or of the one channel a channel page names.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.sermon.net` | Channel podcast feeds (RSS), or the church feed when no channel is listed |
| `*.sermon.net/{mediaCentre}/{channel}` | That channel's podcast feed (RSS) |

### Shinobi Blog

Discovers RSS and Atom feeds for Shinobi Blog, on `blog.shinobi.jp` and on 100 other Ninja Blog domains such as `ni-3.net`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blog.shinobi.jp` | Posts feed (RSS + Atom) |
| `{blog}.{domain}` | Posts feed (RSS + Atom) |

### Spotify for Creators

Discovers RSS feeds for Spotify for Creators (formerly Anchor) podcasts by extracting the station ID from the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `creators.spotify.com/pod/profile/{name}` | Podcast feed* |
| `creators.spotify.com/pod/show/{name}` | Podcast feed* |
| `creators.spotify.com/pod/profile/{name}/episodes/{slug}` | Podcast feed* |

\* *Requires HTML content to extract the station ID.*

### Spreaker

Discovers RSS feeds for Spreaker-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `spreaker.com/podcast/{slug}--{id}` | Podcast feed |

### Tildes

Discovers RSS and Atom feeds for Tildes homepage and groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `tildes.net` | Topics feed (RSS + Atom) |
| `tildes.net/~{group}` | Group feed (RSS + Atom) |

### weblog.lol

Discovers RSS, Atom, and JSON feeds for weblog.lol blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.weblog.lol` | Posts feed (RSS + Atom + JSON) |

### Weebly

Discovers RSS feeds for Weebly-hosted blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.weebly.com` | Blog feed |
| `*.weebly.com/{slug}` | Blog feed (custom page slug) + default blog feed |

### Zenn

Discovers RSS feeds for Zenn users, topics, publications, and the platform-wide trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `zenn.dev/{user}` | User posts feed |
| `zenn.dev/topics/{topic}` | Topic feed |
| `zenn.dev/p/{pub}` | Publication feed |
| `zenn.dev/publications/{pub}` | Publication feed |
| `zenn.dev` | Trending posts feed |

### BitChute

Discovers RSS feeds for BitChute channels. Channel pages carry only an oEmbed link, so nothing finds these without the handler.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bitchute.com/channel/{slug}` | Channel feed (RSS) |

> [!NOTE]
> The feed endpoint accepts only the vanity slug that appears in the channel URL. A channel's internal id returns 404.

### Confluence

Discovers the Atom activity streams of a Confluence Data Center site. Detected by the `confluence-base-url` meta tag, with the context path and space key read from the page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page on a space | Space stream + site stream (Atom) |
| Any other page | Site stream (Atom) |

> [!NOTE]
> Confluence Cloud is not supported. It renders client-side, serves no `confluence-*` meta tag, and its stream needs a session.

### diaspora*

Discovers the Atom feed of a diaspora* profile. Detected by the `Diaspora.Page` global.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{pod}/u/{user}` | Posts feed (Atom) |
| `{pod}/public/{user}` | Posts feed (Atom) |
| `{pod}/people/{guid}` | Posts feed (Atom)* |

\* *Requires HTML content to read the username from the profile's diaspora ID.*

### Instatus

Discovers the incident history feeds of an Instatus status page. Detected by the status page route Instatus names in the `x-matched-path` response header, or by the custom HTML slots of its page template, so custom domains are covered as well as `*.instatus.com` hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any status page | Incident history feed (RSS + Atom) |
| `{page}/{language}/...` | Translated incident history feed (RSS + Atom) |

### Jira

Discovers the Atom activity streams of a Jira site. Cloud is detected by the `atlassian.net` host, Data Center by the `ajs-base-url` meta tag together with a Jira path.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{base}/browse/{KEY}-{n}` | Project stream + site stream (Atom) |
| `{base}/projects/{KEY}` | Project stream + site stream (Atom) |
| Any other Jira page | Site stream (Atom) |

> [!NOTE]
> Bitbucket Server ships the same meta tag and uses `/projects/{KEY}/repos/`, which is excluded. Confluence under `/wiki/` on a Cloud site is excluded too.

### Neocities

Discovers the RSS feed of a Neocities site. The feed is served from `neocities.org`, not from the site's own host, and lists file updates rather than posts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.neocities.org` | Site updates feed (RSS) |
| `neocities.org/site/{user}` | Site updates feed (RSS) |

> [!NOTE]
> A site served on a custom domain carries no username, so it is not matched.

### OpenStatus

Discovers the incident feeds of an OpenStatus status page. Detected by the `/api/status/summary.json` link the page carries, or by its generated preview image.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any status page | Updates feed (RSS + Atom) |

### Postype

Discovers RSS feeds for Postype channels. Channel pages carry no feed link.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `postype.com/@{id}` | Posts feed (RSS) |
| `{id}.postype.com` | Posts feed (RSS) |

### Sourcehut

Discovers the commit and ref feeds of a Sourcehut repository. Repository pages carry no feed link.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `git.sr.ht/~{user}/{repo}` | Commits feed + refs feed (RSS) |

### Squarespace

Discovers the RSS feed of a Squarespace collection. Detected by the `Server: Squarespace` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{collection}` | Collection feed (RSS) |

> [!NOTE]
> The collection slug is operator-chosen, commonly `blog`, `news` or `journal`, so it is taken from the first path segment. The site root is not matched: it answers `?format=rss` with a 400.

### Statuspage

Discovers the incident history feeds of an Atlassian Statuspage status page. Detected by the `x-statuspage-version` response header or the page's `dka575ofm4ao0.cloudfront.net/packs/` assets, so custom domains are covered as well as `*.statuspage.io` hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any status page | Incident history feed (RSS + Atom) |

### Wikidot

Discovers the site and forum feeds of a Wikidot wiki. Detected by the `WIKIDOT.page.listeners.editClick()` call in the page, so custom domains are covered as well as `*.wikidot.com` hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any wiki page | Site changes feed + forum threads feed (RSS) |

### Drupal

Discovers the site feed of a Drupal site. Detected by the `Generator` meta tag or the `X-Generator` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Site feed (RSS) |

> [!NOTE]
> Both signals are Drupal 8 and later, and a site builder can disable the `/rss.xml` view, so treat the feed as a probe.

### Shopify

Discovers the Atom feed of a Shopify store's blog. Detected by the `Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{store}/blogs/{handle}` | Blog feed (Atom) |

> [!NOTE]
> There is no store-wide feed, so the blog handle is required. A missing blog answers 404 with an Atom content type and an empty body.

### HubSpot

Discovers the RSS feeds of a HubSpot blog. Detected by the `HubSpot` generator meta tag or the `x-hs-hub-id` response header. A page the `x-hs-cfworker-meta` header marks as something other than a blog page is not matched.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{blog-path}` | Blog feed (RSS) |
| `{site}/{blog-path}/author/{slug}` | Author feed + blog feed (RSS) |
| `{site}/{blog-path}/topic/{slug}` | Tag feed + blog feed (RSS) |

> [!NOTE]
> The feed hangs off the blog path, never the host root, which answers 404.

### Publii

Discovers the feeds of a Publii-built site. Detected by the `Publii` generator meta tag or by media linked under `/media/website/` or `/media/posts/`. The media links also name the site root, so a site under a sub-path gets its own feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts feed (Atom) + JSON Feed |

> [!NOTE]
> `/feed.xml` is Atom despite the name, and the theme decides whether either file is linked.

### Wix

Discovers the blog feed of a Wix site. Detected by the `Wix.com` generator meta tag, `static.parastorage.com` assets or the `x-wix-request-id` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{account}.wixsite.com/{site}/…` | Blog feed (RSS), under the site path |
| Any other page | Blog feed (RSS) |

> [!NOTE]
> The feed sits at the site root wherever the blog appears in navigation, and only sites with the Wix Blog app installed have it.

### Webnode

Discovers the article feeds of a Webnode site. Detected by the classic editor's client script, so custom domains are covered. Sites built in Webnode 2 serve no feeds and are not matched.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{page}/` | Section articles + all articles (RSS) |
| `{site}/news/{article}/` | All articles (RSS) |
| Any other page | All articles (RSS) |

> [!NOTE]
> A section feed is named after the page that holds its articles, so a page without an articles block has none. A block whose name repeats another's is numbered, `blog1.xml`, and a page holding one gets the unnumbered feed.

### Joomla

Discovers the feed forms of a Joomla list view. Detected by the `Joomla!` generator meta tag or the `joomla-script-options` script every Joomla 3, 4 and 5 page ships.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any list view | View feed (RSS + Atom) |

> [!NOTE]
> Only list views produce a feed. A non-list view answers 404 as `application/xml` with an `<error>` root. The `?format=feed` form is used because it works with and without search-engine friendly URLs, while the `.feed` suffix answers 404 on a site without the `.html` suffix.

### WriteFreely

Discovers the feeds of a WriteFreely blog. Detected by the `WriteFreely` generator meta tag or the `/css/write.css` stylesheet.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{blog}` | Blog feed + instance reader feed (RSS) |
| `{instance}/{blog}/tag:{tag}` | Tag feed + blog feed + instance reader feed (RSS) |
| `{instance}/{post}` on a single-user instance | Blog feed (RSS) |
| `{instance}/page/{n}` on a single-user instance | Blog feed (RSS) |
| `{instance}/lang:{code}` on a single-user instance | Blog feed (RSS) |
| `{instance}/archive` on a single-user instance | Blog feed (RSS) |
| `{instance}/tag:{tag}` on a single-user instance | Tag feed + blog feed (RSS) |

> [!NOTE]
> A single-user instance serves its blog at the root, so the blog path of a post is read from the link in the blog title rather than from the URL.

### Svbtle

Discovers the Atom feed of a Svbtle blog. Detected by the `Svbtle.com` generator meta tag or `lightning.svbtle.com/cargo/` assets.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page on a blog host | Posts feed (Atom) |

> [!NOTE]
> `svbtle.com` itself is excluded: its `/feed` answers 200 with an HTML discovery page, and the `svbtle.com/{user}/feed` form does not exist.

### Textpattern

Discovers the feeds of a Textpattern site. Detected by the `Textpattern` generator meta tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts feed (RSS + Atom) |

### Grav

Discovers the feed forms of a Grav listing page. Detected by the `GravCMS` generator meta tag, a `/user/themes/` or `/user/plugins/` asset path, or the `grav-site-{hash}` cookie.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/` | Site root feed (RSS + Atom) at `/.rss` and `/.atom` |
| Any listing page | Page feed (RSS + Atom) |

> [!NOTE]
> The generator value is matched in full, because the meta content is compared as a prefix and `Grav` alone also matches Gravity Forms.

### Mailchimp

Discovers the RSS feed of a Mailchimp campaign archive.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{dc}.campaign-archive.com/?u={u}&id={id}` | Archive feed (RSS) |

> [!NOTE]
> The datacentre prefix and both ids come from the input URL; none of them can be derived.

### Discuz!

Discovers the feeds of a Discuz! board. Detected by the `Discuz!` generator meta tag or the `{prefix}_saltkey` cookie.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/forum-{fid}-1.html` | Board feed + site feed (RSS) |
| Any other page | Site feed (RSS) |

> [!NOTE]
> Many installs gate the feed behind a login and answer with an HTML notice at status 200, so the body is what decides.

### XenForo

Discovers the feeds of a XenForo board. Detected by the `XF` or `XenForo` id on the html element.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/f/{slug}.{id}` or `{board}/forums/{slug}.{id}` | Forum feed + board feed (RSS) |
| Any other page | Board feed (RSS)* |

\* *The board feed sits under the forum route prefix, `/forums/-/index.rss` by default and `/f/-/index.rss` where the board renames it. A page outside a forum carries no prefix, so both are emitted.*

> [!NOTE]
> A missing forum answers with an XML error document rather than HTML, so a check for well-formed XML passes on a 404.

### FC2 Blog

Discovers the RSS feeds of an FC2 blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.blog.fc2.com` | Posts + comments + trackbacks feeds (RSS) |
| `{user}.blog{n}.fc2.com` | Posts + comments + trackbacks feeds (RSS) |

> [!NOTE]
> The canonical host redirects to a numbered host from the old sharding scheme, so both shapes are matched and the feed is built from whichever host answers.

### Togetter

Discovers the feeds of a Togetter curator or the site-wide popular feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `togetter.com/id/{user}` | Curator feed + popular feed (RSS) |
| Any other page | Popular feed (RSS) |

### Syosetu

Discovers the Atom feeds of a Syosetu author.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `mypage.syosetu.com/{writerId}` | Author novels + activity feeds (Atom) |

> [!NOTE]
> There is no per-work feed, and a novel URL carries an ncode rather than the numeric writer id, so only an author page resolves.

### Cnblogs

Discovers the feed of a Cnblogs blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `cnblogs.com/{user}` | Posts feed |

> [!NOTE]
> The response says RSS while the document is Atom, and the body opens with a byte order mark before the XML declaration.

### Homeland

Discovers the feeds of a Homeland forum. Detected by the `Homeland` generator meta tag or the `_homeland_session` cookie.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/topics/node{id}` | Node feed + topics feed (RSS) |
| Any other page | Topics feed (RSS) |

### LearnKu

Discovers the feeds of a LearnKu community.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `learnku.com/{community}` | Community feed + site feed (RSS) |
| Any other page | Site feed (RSS) |

### Habr

Discovers the feeds of a Habr hub, user or company, plus the site articles feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `habr.com/{lang}/hubs/{hub}` | Hub feed + articles feed (RSS) |
| `habr.com/{lang}/users/{user}` | User feed + articles feed (RSS) |
| `habr.com/{lang}/companies/{company}` | Company feed + articles feed (RSS) |
| Any other page | Articles feed (RSS) |

> [!NOTE]
> The language segment is taken from the page URL and every one of these paths needs its trailing slash.

### phpBB

Discovers the feeds of a phpBB board. Detected by the `phpbb` body id or the `{name}_u`, `{name}_k` and `{name}_sid` cookies.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/viewtopic.php?t={id}` | Topic feed + forum feed + board feeds (Atom) |
| `{board}/viewtopic.php?p={id}` | Topic feed from the page's canonical link + board feeds (Atom) |
| `{board}/viewforum.php?f={id}` | Forum feed + board feeds (Atom) |
| Any other page | Board feeds: all posts, news, new topics, active topics, forums (Atom) |

> [!NOTE]
> A board is routinely mounted under a sub-path, so the feed is built from the directory holding the script. Each feed is an administrator toggle, so a board serves any subset of them.

### NodeBB

Discovers the feeds of a NodeBB forum. Detected by the `X-Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{forum}/category/{cid}` | Category feed + site feeds (RSS) |
| `{forum}/topic/{tid}` | Topic feed + site feeds (RSS) |
| Any other page | Recent feed + popular feed (RSS) |

### FluxBB

Discovers the feeds of a FluxBB board. Detected by the `brdheader` and `brdmain` ids together, or the `brdmenu` and `brdfooter` ids together, which the board prints whatever its template.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/viewforum.php?id={id}` | Forum feed (Atom) + posts feed (RSS + Atom) |
| `{board}/viewtopic.php?id={id}` | Topic feed (Atom) + posts feed (RSS + Atom) |
| Any other page | Posts feed (RSS + Atom) |

### MyBB

Discovers the feeds of a MyBB board. Detected by the `mybb[lastvisit]` cookie, under any cookie prefix, or the `cookiePrefix` and `cookieDomain` script variables core prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/forumdisplay.php?fid={id}` or `{board}/forum-{id}.html` | Forum feed + latest threads feed (RSS + Atom) |
| `{board}/showthread.php?tid={id}` or `{board}/thread-{id}.html` | Forum feed from the breadcrumb + latest threads feed (RSS + Atom) |
| Any other page | Latest threads feed (RSS + Atom) |

> [!NOTE]
> A board is routinely mounted under a sub-path, so the feed is built from the board URL the page prints as `rootpath`, or from the page's directory on a board older than 1.8.

### SMF

Discovers the feeds of a Simple Machines Forum. Detected by the `smf_scripturl` and `smf_theme_url` script variables core prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{script}?board={id}` | Board feed + recent posts feed (RSS + Atom) |
| `{script}?topic={id}` | Board feed from the `rel="index"` link + recent posts feed (RSS + Atom) |
| Any other page | Recent posts feed (RSS + Atom) |

> [!NOTE]
> A forum is routinely mounted under a sub-path, so the feed is built from the script URL the page prints as `smf_scripturl`. A forum can disable feeds, and then the feed URLs answer with an HTML page.

### Mobilizon

Discovers the feeds of a Mobilizon instance or group. Detected by the noscript notice, which is the only text the server renders on every page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{group}` | Group feed + instance feed (Atom) |
| Any other page | Instance feed (Atom) |

### Hubzilla

Discovers the Atom feed of a Hubzilla channel. Detected by the `hubzilla` generator meta tag or the `var zid` script core prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{hub}/channel/{name}`, `{hub}/profile/{name}` or `{hub}/@{name}` | Channel feed (Atom) |

> [!NOTE]
> There is no site-wide feed, so a page outside a channel is not matched.

### snac

Discovers the RSS feed of a snac user. Detected by the `snac/` generator meta tag or the `x-creator: snac/…` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/{user}`, `{instance}/{user}/p/{id}` or `{instance}/{user}/h/{month}.html` | Posts feed (RSS) |

> [!NOTE]
> An instance is routinely mounted under a sub-path, so the feed is built from the page path and never from the origin.

### Shaarli

Discovers the feeds of a Shaarli instance. Detected by the `shaarli-menu` id or the `shaarli` cookie. An instance under a sub-path gets its feeds there, read from `js_base_path` or from the page directory.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts feed (RSS + Atom), plus the pre-0.12 shape |

### PeerTube

Discovers the feeds of a PeerTube instance, channel or account. Detected by the `X-Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/c/{channel}` | Channel feed + instance feed |
| `{instance}/a/{account}` | Account feed + instance feed |
| Any other page | Instance feed |

> [!NOTE]
> A channel federated from another instance is addressed as `handle@remote.host`, and the bare handle answers 404.

### Funkwhale

Discovers the RSS feed of a Funkwhale channel. Detected by the `Funkwhale` generator meta tag or the `fake-app` element of its app shell.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/channels/{handle}` | Channel feed (RSS) |
| `{instance}/channels/{handle}@{domain}` | Channel feed (RSS) on the channel's own instance |

> [!NOTE]
> The v1 API path is emitted rather than v2, which one instance advertises in its own link tag while another answers 404 for it. An unknown channel answers 404 carrying an RSS content type and an `<rss>` root.

### Art19

Discovers the RSS feed of an Art19 show.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `art19.com/shows/{slug}` | Show feed (RSS) |

> [!NOTE]
> The feed is derived from the URL in hand, never from where it redirects: a show can redirect to a site that mentions no feed while the derived feed still resolves.

### Omny Studio

Discovers the RSS feed of an Omny Studio show.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `omny.fm/shows/{slug}` | Show feed (RSS) |

> [!NOTE]
> A show whose page answers 404 can still resolve through this shortcut, which redirects to an identifier path on the content host.

### Blubrry PowerPress

Discovers the podcast feed of a WordPress site running the PowerPress plugin. Detected by the player function the plugin writes into the page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Podcast feed (RSS) |

> [!NOTE]
> Generic discovery finds `{site}/feed/`, which is the blog feed. This adds the podcast feed. A site can redirect it to its podcast host, which resolves normally.

### Podlove Publisher

Discovers the podcast feeds of a WordPress site running the Podlove Publisher plugin. Detected by the plugin's asset path, and the feeds are read from the alternate links the plugin prints on every page, since the owner sets each feed's slug.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Podcast feeds (RSS), one per feed the site marks discoverable |

### Podomatic

Discovers the RSS feed of a Podomatic show.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{show}.podomatic.com` | Show feed (RSS) |
| `podomatic.com/podcasts/{show}` | Show feed (RSS) |

### iVoox

Discovers the RSS feed of an iVoox podcast.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `ivoox.com/{slug}_sq_f{id}_1.html` | Podcast feed (RSS) |
| `ivoox.com/{slug}_rf_{episode}_1.html` | Podcast feed (RSS), read from the episode page's series link |

### Atypon

Discovers the table of contents feed of a journal hosted on Atypon Literatum: ACM, ASCE, Health Affairs, INFORMS, Mary Ann Liebert, NEJM, Sage, Science, SIAM, Taylor & Francis, University of Chicago Press and Wiley.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/toc/{code}/…` | Journal feed (RDF) |
| `{host}/journal/{code}` | Journal feed (RDF) |
| `{host}/loi/{code}` | Journal feed (RDF) |
| `tandfonline.com/journals/{code}` | Journal feed (RDF) |
| `journals.sagepub.com/home/{code}` | Journal feed (RDF) |
| `onlinelibrary.wiley.com/journal/{code}` | Journal feed (RSS) + Most cited (RSS) |

> [!NOTE]
> Journal pages answer a server-side fetch with a Cloudflare challenge, so the feed is derived from the URL alone. Article pages under `/doi/` name no journal and are not matched.

### SoundOn

Discovers the RSS feed of a SoundOn podcast. The player page is a script-only shell with no feed link.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `player.soundon.fm/p/{id}` | Podcast feed (RSS) |
| `player.soundon.fm/p/{id}/episodes/{episodeId}` | Podcast feed (RSS) |
| `player.soundon.fm/embed?podcast={id}` | Podcast feed (RSS) |

### crates.io

Discovers the RSS feeds of crates.io, built from the URL, since the page answers 404 to a request without `Accept: text/html`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `crates.io` | New crates + recent updates feeds (RSS) |
| `crates.io/crates/{name}` | Crate releases feed (RSS) |

> [!NOTE]
> The feed path takes the crate name exactly as crates.io spells it, so a page URL with another case or `-` in place of `_` leads to a feed that answers 403.

### Packagist

Discovers the RSS and Atom feeds of Packagist packages, vendors and the site.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `packagist.org/packages/{vendor}/{package}` | Package releases feed (RSS + Atom) |
| `packagist.org/packages/{vendor}` | Vendor releases feed (RSS + Atom) |
| `packagist.org/extensions` | New extensions + extension releases feeds (RSS + Atom) |
| `packagist.org/*` | New packages + new releases feeds (RSS + Atom) |

### Plurk

Discovers Atom feeds for Plurk users and single plurks.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `plurk.com/{username}` | User plurks feed (Atom) |
| `plurk.com/u/{username}` | User plurks feed (Atom) |
| `plurk.com/m/{username}` | User plurks feed (Atom) |
| `plurk.com/p/{id}` | Plurk responses feed (Atom) |
| `plurk.com/m/p/{id}` | Plurk responses feed (Atom) |

### Internet Archive

Discovers the RSS feeds of Internet Archive collections and searches. A collection page is told from an item page by its markup: collections serve the app shell that loads `/offshoot_assets/`, and items serve full HTML. Item pages resolve nothing.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `archive.org/details/{collection}` | Collection feed (RSS) |
| `archive.org/search?query={query}` | Search feed (RSS) |

### Sveriges Radio

Discovers the feed of a Sveriges Radio program.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `sverigesradio.se/{program}` | Program feed (RSS) |
| `sverigesradio.se/...?programid={id}` | Program feed (Atom) |

> [!NOTE]
> Program pages answer 403 to many server-side fetches, so the feed is derived from the URL alone. A discontinued program's feed answers 404.

### DokuWiki

Discovers the recent changes feeds of a DokuWiki wiki. Detected by the `DokuWiki` session cookie. A wiki under a sub-path gets its feeds there, read from the `start` link the page prints or from the cookie path.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| A page inside a namespace | Namespace recent changes + namespace pages + recent changes |
| Any other page | Recent changes |

> [!NOTE]
> The feed format is a wiki setting, so one wiki serves RSS 1.0 and the next Atom from the same `feed.php`.

### MediaWiki

Discovers the page history and recent changes feeds of a MediaWiki wiki. Detected by the `EditURI` link to `api.php?action=rsd` that core prints in every page head, which also gives the script path, so a wiki under `/w/` gets its feeds there. The page title is read from the `wgPageName` config core prints, whatever the URL rewriting.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page with a title | Page history + recent changes |
| A special page | Recent changes |

### Gancio

Discovers the RSS feeds of a Gancio event calendar. Detected by the `custom_css` stylesheet its layout prints in every page head, which also gives the install root, so a calendar under a sub-path gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/tag/{tag}` | Tag feed (RSS) |
| `{instance}/place/{id}/{name}` | Place feed (RSS) |
| `{instance}/collection/{name}` | Collection feed (RSS) |
| Any other page | Site feed (RSS) |

> [!NOTE]
> The iCal feeds Gancio serves beside each RSS feed are not emitted, since they are not RSS, Atom or JSON feeds. Gancio 2 answers 404 on the tag and place feed paths its own pages advertise.

### Niconico

Discovers the video, live and blog feeds of a Niconico channel on `ch.nicovideo.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `ch.nicovideo.jp/{channel}` | Videos + Live + Blog |
| `ch.nicovideo.jp/{channel}/video` | Videos first, then Live + Blog |
| `ch.nicovideo.jp/{channel}/live` | Live first, then Videos + Blog |
| `ch.nicovideo.jp/{channel}/blomaga` or `ch.nicovideo.jp/{channel}/blomaga/ar{id}` | Blog first, then Videos + Live |

### LibriVox

Discovers the RSS feed of a LibriVox audiobook, read from the feed link on the audiobook page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `librivox.org/{slug}` | Audiobook feed (RSS) |

### PyPI

Discovers the RSS feeds of the Python Package Index, built from the URL.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pypi.org` | New packages + recent updates feeds (RSS) |
| `pypi.org/project/{name}` | Project releases feed (RSS) |
| `pypi.org/project/{name}/{version}` | Project releases feed (RSS) |

### RedCircle

Discovers the RSS feed of a RedCircle show. A show under a slug is read from the show uuid its page names in `og:url`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `redcircle.com/shows/{uuid}` or `redcircle.com/shows/{slug}` | Show feed (RSS) |
| `redcircle.com/shows/{uuid}/ep/{episode}` or `redcircle.com/shows/{slug}/ep/{episode}` | Show feed (RSS) |

### Royal Road

Discovers the update feed of a Royal Road fiction.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `royalroad.com/fiction/{id}` or `royalroad.com/fiction/{id}/{slug}` | Fiction updates (RSS) |
| `royalroad.com/fiction/{id}/{slug}/chapter/{chapterId}/{chapterSlug}` | Fiction updates (RSS) |

> [!NOTE]
> Profile pages and fiction lists serve no feed, so only fiction and chapter pages resolve.

### Flipboard

Discovers the RSS feeds of Flipboard profiles, magazines, storyboards and topics.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `flipboard.com/@{username}` | Profile feed |
| `flipboard.com/@{username}/{magazine}` | Magazine or storyboard feed |
| `flipboard.com/topic/{topic}` | Topic feed |

### Webtoons

Discovers the episode feed of a WEBTOON series, Originals and Canvas alike.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `webtoons.com/{language}/{genre}/{name}/list?title_no={id}` | Series feed |
| `webtoons.com/{language}/{genre}/{name}/{episode}/viewer?title_no={id}` | Series feed |
| `webtoons.com/{language}/canvas/{name}/list?title_no={id}` | Series feed |

### Lichess

Discovers Atom feeds for Lichess user blogs, the official blog and the community blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `lichess.org/@/{user}/blog` or `lichess.org/@/{user}/blog/{slug}/{id}` | User blog feed |
| `lichess.org/blog` or `lichess.org/blog/{id}/{slug}` | Official Lichess blog feed |
| `lichess.org/blog/community` or `lichess.org/{lang}/blog/community` | Community blogs feed, in that language when the URL names one |
| Any other page | Site-wide updates feed |

### @wiki

Discovers the updated pages and new pages feeds of an @wiki (atwiki.jp) wiki. Links to the legacy `www{N}.atwiki.jp` hosts redirect to `w.atwiki.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `w.atwiki.jp/{wiki}/…` | Updated pages (RDF + Atom) + new pages (RDF) |

### Teletype.in

Discovers RSS and Atom feeds for Teletype.in blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `teletype.in/@{user}` | Posts feed (RSS + Atom) |
| `teletype.in/@{user}/{post}` | Posts feed (RSS + Atom) |

### PmWiki

Discovers the recent changes feeds of a PmWiki wiki. Detected by the `<!--HTMLHeader-->` comment every skin prints, so any domain is covered. A wiki under a sub-path gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{wiki}/{Group}/{Page}` | Group recent changes + site recent changes (RSS + Atom) |
| `{wiki}?n={Group}.{Page}` | Group recent changes + site recent changes (RSS + Atom) |
| Any other page | Site recent changes (RSS + Atom) |

> [!NOTE]
> Feeds are off in a default PmWiki install and a wiki owner turns them on, so many wikis answer these URLs with the page itself.

### Ning

Discovers the site feeds of a Ning network and the feed of a forum topic. Detected by the `static.ning.com/socialnetworkmain/` asset path, so `ning.com` subdomains and custom domains are both covered. Ning 3 networks load their assets from another path and serve none of these feeds, so they are left to generic discovery.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{network}/forum/topics/{topic}` | Topic + latest activity + blog posts + forum |
| Any other page | Latest activity + blog posts + forum |

### vBulletin

Discovers the feeds of a vBulletin 3 to 6 forum. Detected by the `clientscript/vbulletin-core.js` script of vBulletin 4, the `js/header-rollup` script of vBulletin 5 and 6, or the `{prefix}lastvisit` and `{prefix}lastactivity` cookies.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{forum}/forumdisplay.php?f={id}` | Forum feed + site feed (RSS) |
| `{forum}/forumdisplay.php?{id}-{title}` | Forum feed + site feed (RSS) |
| Any other page | Site feed (RSS) |
| Any vBulletin 5 or 6 channel page | Channel feed + site feed (RSS) |
| Any vBulletin 5 or 6 page | Site feed at `{forum}/external?type=rss2` (RSS) |

> [!NOTE]
> The forum root is read from the core script's URL, or the page's `<base>` on vBulletin 5 and 6, so a forum under a sub-path or behind rewritten page URLs gets its feeds there. A vBulletin 3 or 4 forum with feeds turned off answers these URLs with an empty page.

### Omeka

Discovers the item feeds of an Omeka Classic site, self-hosted or on `omeka.net`. Detected by the plugin and core script asset paths every page loads, so any domain is covered. A site under a sub-path gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/items/browse?{filters}` | Filtered items feed for the same tags, collection or search (RSS + Atom) |
| Any other page | Items feed (RSS + Atom) |

### Koha

Discovers the feeds of a Koha library catalogue. Detected by the `/opac-tmpl/` asset path every OPAC theme loads, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{catalogue}/cgi-bin/koha/opac-search.pl?q={query}` | Search results, newest acquisitions first (RSS) |
| `{catalogue}/cgi-bin/koha/opac-shelves.pl?op=view&shelfnumber={id}` | List (RSS) |
| `{catalogue}/cgi-bin/koha/opac-showreviews.pl` | Recent comments (RSS) |

### public-inbox

Discovers the Atom feeds of a public-inbox mailing list archive. Detected by the help and color links every page prints, so any domain is covered, and `lore.kernel.org` by its host, since its pages answer a plain fetch with a bot challenge. An inbox under a sub-path or at the root of its host gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{inbox}/` | Messages feed (Atom) |
| `{inbox}/{message-id}/` | Thread feed + messages feed (Atom) |
| `{inbox}/{message-id}/T/` | Thread feed + messages feed (Atom) |

### CivicPlus

Discovers the module feeds of a CivicPlus government website. Detected by the `CP_IsMobile` cookie or the `/Areas/Layout/Assets/` scripts, so any domain is covered. The module is read from the page's `pageModuleID` field, and a page with no module feed gets the site-wide Pages feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/CivicAlerts.aspx`, `{site}/m/newsflash` | News Flash feed (RSS) |
| `{site}/Blog.aspx` | Blog feed (RSS) |
| `{site}/Gallery.aspx` | Photo Gallery feed (RSS) |
| `{site}/Calendar.aspx`, `{site}/m/calendar` | Calendar feed (RSS) |
| `{site}/AlertCenter.aspx` | Alert Center feed (RSS) |
| `{site}/RealEstate.aspx` | Real Estate Locator feed (RSS) |
| `{site}/AgendaCenter` | Agenda Center feed (RSS) |
| `{site}/Jobs.aspx` | Jobs feed (RSS) |
| `{site}/CivicMedia.aspx` | Media Center feed (RSS) |
| `{site}/`, any other page | Pages feed (RSS) |

> [!NOTE]
> Each feed covers every category of its module. The home page, content pages and modules with no feed of their own get the Pages feed.

### DSpace

Discovers the OpenSearch feeds of a DSpace 7 or later repository. Detected by the `ds-app` element of its Angular app, so any domain is covered. The feeds are built on the REST API the page's config names, which can sit on another host.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{repository}/collections/{uuid}` | Collection feed + site feed (RSS + Atom) |
| `{repository}/communities/{uuid}` | Community feed + site feed (RSS + Atom) |
| Any other page | Site feed (RSS + Atom) |

> [!NOTE]
> The search endpoint ignores a scope it does not know and answers with the site feed, so only an id the page URL names is used.

### SPIP

Discovers the feeds of a SPIP site. Detected by the `Composed-By` or `X-Spip-Cache` header SPIP sends with every page, so any domain is covered. A site under a sub-path gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/spip.php?article{id}`, `article{id}.html` | Article comments + latest articles |
| `{site}/spip.php?rubrique{id}`, `rubrique{id}.html` | Section + latest articles |
| `{site}/spip.php?mot{id}`, `mot{id}.html` | Keyword + latest articles |
| `{site}/spip.php?auteur{id}`, `auteur{id}.html` | Author + latest articles |
| Any other page | Latest articles |

> [!NOTE]
> Comment feeds come from the comments plugin, so a site without it answers them with an error. Each page is also recognised in its `spip.php?page=article&id_article={id}` form. Rewritten URLs such as `/Some-Title` name no id, and those pages get the latest articles feed alone.

### Odoo

Discovers the Atom feed of a blog on an Odoo website. Detected by the `frontend_lang` and `session_id` cookies Odoo sets on every website page, so any domain is covered. A page under a language prefix gets the feed in that language.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/blog/{blog}-{id}` | Blog feed (Atom) |
| `{site}/blog/{blog}-{id}/{post}-{id}` | Blog feed (Atom) |
| `{site}/blog/{blog}-{id}/post/{post}-{id}` | Blog feed (Atom) |
| `{site}/blog/{blog}-{id}/tag/{tag}-{id}` | Blog feed (Atom) |

### Zenfolio

Discovers the gallery and blog feeds of a Zenfolio photography site. A custom domain is detected by `cdn.zenfolio.com/zf/` stylesheets or the `zf_5y_visitor` cookie.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.zenfolio.com/…` | Recent galleries + featured galleries + blog (RSS + Atom) |
| Any other page | Recent galleries + featured galleries + blog (RSS + Atom) |

> [!NOTE]
> The featured and blog feeds answer with no items on a site that has no featured galleries or blog posts.

### BubbleLife

Discovers the RSS feed of a BubbleLife community. The page's alternate link has no `href`, so the feed id is read from the community's library links.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{city}.bubblelife.com/community/{name}` | Posts feed (RSS) |
| `{city}.bubblelife.com/community/{name}/library/{id}` | Library feed (RSS) |
| `{city}.bubblelife.com/community/{name}/type/rssinfo` | Posts feed (RSS) |

> [!NOTE]
> A city news community links no library of its own, so its page yields no feed. Its rssinfo page names the feed.

### BigCommerce

Discovers the product and blog feeds of a BigCommerce store. Detected by the `SHOP_SESSION_TOKEN` cookie, so any domain is covered. Interspire Shopping Cart installs set the same cookie and serve the same feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Category page | Category new products + category popular products + store feeds (RSS + Atom) |
| `{store}/search.php?search_query={query}` | Product search + store feeds (RSS + Atom) |
| Any other page | New products + popular products + featured products + blog (RSS + Atom) |

> [!NOTE]
> A category URL carries only its slug, so the category id is read from the feed link the category page prints.

### Cocolog

Discovers the posts feeds of a Cocolog blog on `cocolog-nifty.com` and its sibling domains. One account can host several blogs, each under its own path. The home page names its blog only in its feed links, so a home page URL needs the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.cocolog-nifty.com/{blog}/…` | Posts feed (Atom + RDF + RSS) |
| `{user}.cocolog-nifty.com` | Posts feed of the blog the page links (Atom + RDF + RSS) |

### blog.hu

Discovers the feeds of blog.hu blogs, and the activity feed of a blog.hu user.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blog.hu` | Posts feed (RSS + Atom) + comments feed (RSS + Atom) |
| `blog.hu/user/{id}` | User activity feed (RSS) |

### ChamberMaster

Discovers the RSS feeds of a ChamberMaster (GrowthZone) chamber of commerce directory. Detected by the `x-source: cmdotnet…` response header, so any domain is covered. The pages link none of these feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/events/…` | Upcoming events + new events + featured events |
| `{site}/list/…` | New members + featured members |
| `{site}/jobs/…` | New jobs |
| `{site}/hotdeals/…` | New coupons |
| `{site}/marketspace/…`, `{site}/marketplace/…` | New marketplace items |
| `{site}/news/…` | News releases |
| `{site}/MemberToMember/…` | New member to member deals |

### PChome Online 個人新聞台

Discovers RSS feeds for papers on PChome's blog host, including category feeds. Pages on the mobile host `mypaper.m.pchome.com.tw` get the same feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `mypaper.pchome.com.tw/{user}` | Posts feed |
| `mypaper.pchome.com.tw/{user}/category/{id}` | Category feed + posts |

### PukiWiki

Discovers the recent changes feed of a PukiWiki wiki or a Quick Homepage Maker site. Detected by the default `pukiwiki.css` stylesheet, or by Quick Homepage Maker's `QHMSSID` session cookie, so any domain is covered. A wiki under a sub-path or on rewritten page URLs gets its feed at its own root.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{wiki}/index.php?{Page}` | Recent changes (RSS) |
| `{wiki}/?{Page}` | Recent changes (RSS) |
| `{wiki}/{Page}` | Recent changes (RSS) |

### Gnuboard

Discovers the RSS feed of a Gnuboard 4 or 5 board. Detected by the visit cookie Gnuboard sets under the md5 of `ck_visit_ip`, so any domain is covered. A board under a sub-path gets its feed there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/bbs/board.php?bo_table={board}` | Board feed |
| `{site}/bbs/board.php?bo_table={board}&wr_id={post}` | Board feed |
| `{site}/{board}` or `{site}/{board}/{post}` on Gnuboard 5 | Board feed, read from the page's `g5_bo_table` variable |

> [!NOTE]
> A board owner can turn its feed off, and Gnuboard then answers the feed URL with an HTML page, so discovery finds nothing there.

### ProBoards

Discovers the posts feed of a ProBoards forum.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.proboards.com` | Posts feed (RSS) |
| `*.freeforums.net` | Posts feed (RSS) |
| `*.boards.net` | Posts feed (RSS) |

> [!NOTE]
> A request with a browser user agent gets a proof-of-work challenge instead of the page, so the feed is built from the forum host alone. The feed answers 406 to a bare `Mozilla/5.0` or an empty user agent.

### The Mail Archive

Discovers the RSS feed of a mailing list archived on The Mail Archive (mail-archive.com). The list is named by its posting address in the first path segment.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `mail-archive.com/{list}/` | Mailing list feed |
| `mail-archive.com/{list}/msg{n}.html` | Mailing list feed |

### Bloggang

Discovers RSS feeds for Bloggang blogs. A blog lives on its own subdomain, which redirects to its pages on `www.bloggang.com`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.bloggang.com` | Posts feed |
| `www.bloggang.com/mainblog.php?id={user}` | Posts feed |
| `www.bloggang.com/viewblog.php?id={user}` | Posts feed |
| `www.bloggang.com/viewdiary.php?id={user}` | Posts feed |

### SME Blog

Discovers the RSS feeds of blogs on SME Blog, the blog platform of the Slovak daily SME.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.sme.sk/{user}` | Posts feed |
| `blog.sme.sk/{user}/{category}/{slug}` | Posts feed |
| `blog.sme.sk` | Site feed |
| `blog.sme.sk/t/{topic}` | Site feed |

### Acomics

Discovers RSS feeds for Acomics comics and users. A user's feed carries the new issues of the comics the user subscribes to.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `acomics.ru/~{comic}` | Comic issues feed |
| `acomics.ru/-{user}` | User subscriptions feed |

### OpenCart Journal

Discovers the blog feed of an OpenCart store running the Journal theme. Detected by the `data-jv` or `data-j2v` version attribute Journal prints on the `<html>` element, so any domain is covered. A store under a sub-path gets its feed there, read from the page's `<base href>`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page of a Journal 3 store | Blog feed (RSS), `route=journal3/blog/feed`, or `journal3/blog.feed` on OpenCart 4 |
| Any page of a Journal 2 store | Blog feed (RSS), `route=journal2/blog/feed` |

### Eklablog

Discovers the posts and comments feeds of an Eklablog blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.blogg.org`, `*.blogueuse.fr`, `*.cd.st`, `*.doremiblog.com`, `*.ek.la`, `*.eklablog.com`, `*.eklablog.fr`, `*.eklablog.net`, `*.id.st`, `*.jeblog.fr`, `*.kazeo.com`, `*.kif.fr`, `*.lo.gs`, `*.revolublog.com`, `*.zic.fr` | Posts feed + comments feed |

### ComicFury

Discovers the feeds of a ComicFury webcomic.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{comic}.thecomicseries.com`, `.thecomicstrip.org`, `.the-comic.org`, `.webcomic.ws` or `.cfw.me` | Comic feed |
| `comicfury.com/comicprofile.php?url={comic}` | Comic feed |
| `comicfury.com/read/{comic}` | Comic feed in the ComicFury reader |

### Haley Marketing job boards

Discovers the jobs feed of a job board Haley Marketing hosts for a staffing firm. Detected by the `x-sasnode` response header naming a `haleymarketing.com` node together with a link to the board's `/index.smpl?arg=jb_` routes, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any board page | Jobs feed |

### Jimdo

Discovers the blog feed of a Jimdo site. Detected by the `x-jimdo-wid` response header, so `*.jimdofree.com` sites and custom domains are both covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Blog feed (RSS) |

> [!NOTE]
> Only sites with a blog have the feed.

### YesWiki

Discovers the Bazar entry feeds and the recent changes feed of a YesWiki wiki. Detected by the `YesWiki-` session cookie. A wiki under a sub-path gets its feeds there, read from the cookie path. Form ids come only from the entries and lists the page shows.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| A page showing Bazar entries or lists | Entries of each form shown + all entries + recent changes |
| Any other page | All entries + recent changes |

### Forumotion

Discovers the feeds of a Forumotion forum, also branded Forumactif, Foroactivo, Forumeiros and Ahlamontada. Detected by the `_userdata` script every page prints, so custom domains are covered. The forum comes from the page's breadcrumb.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{forum}/f{id}-{slug}` | Forum feed + latest topics feed (RSS + Atom) |
| `{forum}/t{id}-{slug}` | Feed of the topic's forum + latest topics feed (RSS + Atom) |
| Any other page | Latest topics feed (RSS + Atom) |

### Noticeable

Discovers the feeds of a Noticeable newspage. Newspages on `noticeable.news` are matched by host, and a newspage on a custom domain by the `assets.noticeable.news/templates/` stylesheets every template loads.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{newspage}/labels/{label}` | Label feed + newspage feed (RSS + Atom + JSON Feed) |
| Any other page | Newspage feed (RSS + Atom + JSON Feed) |

> [!NOTE]
> A label page links only the newspage feed, never its own label feed.

### Legistar

Discovers the history feed of a Legistar legislation record or meeting, on any `*.legistar.com` client site.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{client}.legistar.com/LegislationDetail.aspx?ID={id}&GUID={guid}` | Legislation feed (RSS) |
| `{client}.legistar.com/MeetingDetail.aspx?ID={id}&GUID={guid}` | Meeting feed (RSS) |

### Nethouse

Discovers the news and articles feeds of a Nethouse site. Custom domains are detected by the `x-generator: nethouse` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.nethouse.ru`, `*.nethouse.me` | News + articles (RSS) |
| Any other Nethouse page | News + articles (RSS) |

> [!NOTE]
> A site with the news or articles section turned off answers that feed with 404.

### Hautetfort

Discovers RSS and Atom feeds for blogs on `*.hautetfort.com`, `*.blogspirit.com` and `*.blogspirit-business.com`. Blog feeds are built on `http`, since blog subdomains serve no certificate for their own name.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.{domain}` | Posts feed (RSS + Atom) |
| `{blog}.{domain}/{category}` | Category feed (RSS) + posts |
| `{blog}.{domain}/archives/category/{category}` | Category feed (RSS) + posts |

### uCoz

Discovers the module and forum feeds of a uCoz site. Covers sites on the uCoz domains, such as `*.ucoz.ru`, `*.at.ua` and `*.narod.ru`, and custom domains through the `{n}{site}uCoz` cookie every uCoz page sets.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{module}/…` | Module feed (RSS) for `news`, `publ`, `load`, `photo`, `blog`, `dir`, `board`, `stuff` and `forum` |
| `{site}/forum/{section}…` | Forum section feed + forum feed (RSS) |
| Any other page | News feed (RSS) |

> [!NOTE]
> A module the site has not turned on answers 404.

### dasauge

Discovers the RSS feed of a dasauge member profile on any of the dasauge country domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dasauge.de/-{member}` | Profile feed |
| `dasauge.de/-{member}/{page}` | Profile feed |

### Estranky

Discovers the site feeds of an Estranky site. A site serves the article feeds, the Web Slice feeds or both, depending on its template, and validation drops a set it lacks.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}.estranky.cz/…` | Posts + photos + comments + home page slice + photo album slice |
| `{site}.estranky.sk/…` | Posts + photos + comments + home page slice + photo album slice |

### Color Me Shop

Discovers the RSS 1.0 and Atom feeds of new products in a Color Me Shop store. Shops on `shop-pro.jp` are matched by host, and a shop on its own domain by the `colorme_PHPSESSID` cookie every shop page sets.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{shop}.shop-pro.jp` | Products feed (RSS 1.0 + Atom) |
| `{domain}`, a shop on its own domain | Products feed (RSS 1.0 + Atom) |

### PRLog

Discovers the press releases feed of a PRLog pressroom.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pressroom.prlog.org/{id}` | Press releases feed |

### Rakuten Blog

Discovers the RSS feed of a Rakuten Blog (plaza.rakuten.co.jp) blog, which Rakuten serves from `api.plaza.rakuten.ne.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `plaza.rakuten.co.jp/{user}/…` | Posts feed |

### Overblog

Discovers the posts feed of an Overblog blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.over-blog.com`, `*.over-blog.de`, `*.over-blog.es`, `*.over-blog.fr`, `*.over-blog.it`, `*.over-blog.net`, `*.over-blog.org`, `*.over.blog`, `*.overblog.com`, `*.overblog.fr` | Posts feed |

### ExportersIndia

Discovers the products feed of an ExportersIndia business site, built by Weblink.In on the business's own domain. Detected by the template stylesheet on `catalog.wlimg.com` together with the page's link to `/products.rss`, so any domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Products feed (RSS) |

### Wild Apricot

Discovers the blog and events feeds of a Wild Apricot site. Detected by the `x-lb-server` response header, so `*.wildapricot.org` sites and custom domains are both covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{blog-page}` | Blog feed (RSS) |
| `{site}/{blog-page}/{post-id}` | Blog feed (RSS), from the post's back link |
| `{site}/{events-page}` | Events feed (RSS), in the list and calendar views |

> [!NOTE]
> A post page links `/page-{id}/RSS` as its feed, which answers 404. An event page links no events page, so it gets no feed.

### Jellypod

Discovers RSS feeds for Jellypod-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.jellypod.com` | Podcast feed (RSS) |

### Goope

Discovers the news feed of a Goope site, and the member news feed of a chamber of commerce site. Sites on a custom domain are detected by the QR code image served from `r.goope.jp` or a favicon on `cdn.goope.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `r.goope.jp/{site}/…` | News feed (RDF) |
| `r.goope.jp/{site}/shokokai/member/…` | Member news + news feed (RDF) |
| `{domain}/shokokai/member/…` | Member news + news feed (RDF) |
| `{domain}/…` | News feed (RDF) |

> [!NOTE]
> A page under a `t_{id}` template segment gets its feeds under that segment, as the page links them.

### Duck Webcomics

Discovers the feed of a webcomic on The Duck Webcomics.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `theduckwebcomics.com/{comic}/…` | Comic feed |

### is-Programmer

Discovers RSS feeds for is-Programmer blogs, including the comment feed of a post.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.is-programmer.com` | Posts + comments + messages |
| `{blog}.is-programmer.com/posts/{id}` | Post comments + posts + comments + messages |

> [!NOTE]
> is-Programmer serves its blogs over http only, so the feeds are http URLs whatever the page URL's scheme.

### twoday

Discovers RSS 1.0 feeds for blogs on `*.twoday.net`. A blog's skin links its posts feed as `/index.rdf` or `/rss`, and both serve the same feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.twoday.net` | Posts feed |
| `{blog}.twoday.net/topics/{topic}` | Topic feed + posts |

### cppblog

Discovers RSS feeds for cppblog blogs on `www.cppblog.com` and `cppblog.com`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `cppblog.com/{user}` | Posts + comments |
| `cppblog.com/{user}/category/{id}.html` | Category + posts + comments |
| `cppblog.com/{user}/favorite/{id}.html` | Favorites + posts + comments |

> [!NOTE]
> The site's https certificate has expired, so the feeds are `http://www.cppblog.com` URLs whatever the page URL's scheme and host.

### Reformal

Discovers the feedback feed of a Reformal project, on reformal.ru and its English farm idea.informer.com.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{project}.reformal.ru` | Feedback feed (RSS) |
| `{project}.idea.informer.com` | Feedback feed (RSS) |

### Bloggo

Discovers RSS feeds for Bloggo blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `*.bloggo.nu` | Posts feed |
| `*.bloggo.nu/{slug}` | Post comments feed + posts |

### podCloud

Discovers the RSS feed of a show hosted on podCloud.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{show}.lepodcast.fr` | Podcast feed (RSS) |

### PromoDJ

Discovers the feeds of a PromoDJ artist profile.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `promodj.com/{user}` | Podcast + content + blog + favorites + events feeds |
| `promodj.com/{user}/…` | Podcast + content + blog + favorites + events feeds |

> [!NOTE]
> A feed the artist has never posted to answers with a redirect to the profile, which validation drops.

### Shopserve

Discovers the news feed of a Shopserve shop. Detected by the root-relative `/hpgen/HPB/` links and theme images every generated desktop page carries, so a shop on its own domain is covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any desktop page | News feed (RSS) |

### KKTIX

Discovers the Atom feed of a KKTIX organizer's public events.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{organizer}.kktix.cc` | Events feed |
| `{organizer}.kktix.cc/events/{event}` | Events feed |

## Basic Usage

```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://github.com/macieklamberski/feedsmith', {
  methods: ['platform'],
})

// [
//   { url: 'https://github.com/macieklamberski/feedsmith/releases.atom', ... },
//   { url: 'https://github.com/macieklamberski/feedsmith/commits.atom', ... },
//   { url: 'https://github.com/macieklamberski/feedsmith/tags.atom', ... },
// ]
```

## Configuration

### Handler Order

Handlers are checked in order. The first matching handler that generates feeds wins:

```typescript
import { githubHandler, redditHandler, youtubeHandler } from 'feedscout/platform'

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
  acastHandler,
  acomicsHandler,
  amebloHandler,
  applePodcastsHandler,
  arenaHandler,
  art19Handler,
  artstationHandler,
  atwikiHandler,
  atyponHandler,
  audioboomHandler,
  aushaHandler,
  bearblogHandler,
  behanceHandler,
  bigcommerceHandler,
  bitchuteHandler,
  bloggangHandler,
  bloggoHandler,
  blogHuHandler,
  blogspotHandler,
  blueskyHandler,
  bookwyrmHandler,
  bubblelifeHandler,
  buttondownHandler,
  buzzsproutHandler,
  canalblogHandler,
  canpanHandler,
  captivateHandler,
  castopodHandler,
  castosHandler,
  chambermasterHandler,
  civicplusHandler,
  cnblogsHandler,
  cocologHandler,
  colorMeShopHandler,
  comicfuryHandler,
  confluenceHandler,
  cppblogHandler,
  cratesIoHandler,
  csdnHandler,
  dailymotionHandler,
  dasaugeHandler,
  deviantartHandler,
  devtoHandler,
  diasporaHandler,
  discourseHandler,
  dokuwikiHandler,
  doubanHandler,
  dreamwidthHandler,
  drupalHandler,
  dspaceHandler,
  eklablogHandler,
  estrankyHandler,
  exblogHandler,
  exportersIndiaHandler,
  fc2Handler,
  firesideHandler,
  firstoryHandler,
  flickrHandler,
  flipboardHandler,
  forumotionHandler,
  friendicaHandler,
  gancioHandler,
  ghostHandler,
  giteaHandler,
  githubHandler,
  githubGistHandler,
  gitlabHandler,
  gnuboardHandler,
  goodreadsHandler,
  goopeHandler,
  habrHandler,
  hackernewsHandler,
  haleyJobsHandler,
  hashnodeHandler,
  hatenaAntennaHandler,
  hatenaBookmarkHandler,
  hatenaFotolifeHandler,
  hatenablogHandler,
  hautetfortHandler,
  hearthisHandler,
  heyWorldHandler,
  insanejournalHandler,
  instatusHandler,
  internetArchiveHandler,
  isProgrammerHandler,
  itchioHandler,
  ivooxHandler,
  jellypodHandler,
  jimdoHandler,
  jiraHandler,
  jugemHandler,
  kickstarterHandler,
  kktixHandler,
  kohaHandler,
  launchpadHandler,
  learnkuHandler,
  legistarHandler,
  lemmyHandler,
  letterboxdHandler,
  librivoxHandler,
  libsynHandler,
  lichessHandler,
  listedHandler,
  livedoorBlogHandler,
  livejournalHandler,
  lobstersHandler,
  mailchimpHandler,
  mastodonHandler,
  mataroaHandler,
  mediawikiHandler,
  mediumHandler,
  megaphoneHandler,
  microblogHandler,
  misskeyHandler,
  myanimelistHandler,
  naverBlogHandler,
  nebulaHandler,
  neocitiesHandler,
  nethouseHandler,
  niconicoHandler,
  ningHandler,
  nodebbHandler,
  noteHandler,
  noticeableHandler,
  observableHandler,
  odooHandler,
  odyseeHandler,
  omekaHandler,
  omnystudioHandler,
  opencartJournalHandler,
  openstatusHandler,
  overblogHandler,
  packagistHandler,
  pagecordHandler,
  paragraphHandler,
  pchomeHandler,
  peertubeHandler,
  pikaHandler,
  pinboardHandler,
  pinterestHandler,
  pixelfedHandler,
  pleromaHandler,
  plurkHandler,
  pmwikiHandler,
  podbeanHandler,
  podcloudHandler,
  podhomeHandler,
  podigeeHandler,
  podloveHandler,
  podomaticHandler,
  postachioHandler,
  posthavenHandler,
  postypeHandler,
  prlogHandler,
  proboardsHandler,
  producthuntHandler,
  promodjHandler,
  proseHandler,
  publicInboxHandler,
  pypiHandler,
  qiitaHandler,
  rakutenBlogHandler,
  redcircleHandler,
  redditHandler,
  reformalHandler,
  royalroadHandler,
  rssComHandler,
  rubygemsHandler,
  sakuraBlogHandler,
  seesaaHandler,
  sermonNetHandler,
  shinobiHandler,
  shopifyHandler,
  shopserveHandler,
  smeBlogHandler,
  soundcloudHandler,
  soundonHandler,
  sourceforgeHandler,
  sourcehutHandler,
  spotifyForCreatorsHandler,
  spreakerHandler,
  squarespaceHandler,
  stackExchangeHandler,
  statuspageHandler,
  steamHandler,
  substackHandler,
  sverigesRadioHandler,
  syosetuHandler,
  teletypeHandler,
  tildesHandler,
  tistoryHandler,
  togetterHandler,
  transistorHandler,
  tumblrHandler,
  twodayHandler,
  ucozHandler,
  v2exHandler,
  vbulletinHandler,
  velogHandler,
  vimeoHandler,
  weblogLolHandler,
  webnodeHandler,
  webtoonsHandler,
  weeblyHandler,
  wikidotHandler,
  wildApricotHandler,
  wordpressHandler,
  wpengineHandler,
  writeasHandler,
  xenforoHandler,
  ximalayaHandler,
  yeswikiHandler,
  youtubeHandler,
  zennHandler,
} from 'feedscout/platform'
```

## Using Directly

Use the Platform discovery function directly to get URIs without validation:

```typescript
import { discoverUrisFromPlatform, youtubeHandler } from 'feedscout/platform'

const uris = await discoverUrisFromPlatform(htmlContent, undefined, {
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
//     hint: { key: 'youtube:videos', label: 'Videos' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUSHBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:shorts', label: 'Shorts' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:live', label: 'Live streams' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULPBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:popular-videos', label: 'Popular videos' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPSBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:popular-shorts', label: 'Popular shorts' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:popular-live', label: 'Popular live streams' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMOBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:member-videos', label: 'Member videos' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMSBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:member-shorts', label: 'Member shorts' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:member-live', label: 'Member live streams' },
//   },
// ]
```

The arguments are the page content, the response headers, the options, an optional `fetchFn` that is passed on to handlers, and an optional `onError` that receives a throw from a handler or from `enrichFn`. Pass `undefined` for content or headers you do not have.

> [!NOTE]
> The YouTube handler requires HTML content for `@handle`, `/user/`, `/c/`, and video URLs to extract the channel ID. For `/channel/UC...` URLs, no content is needed.

## Creating Custom Handlers

You can create handlers for platforms not included by default.

### Handler Interface

A `PlatformHandler` has two methods and an optional regex:

```typescript
type PlatformHandler = {
  match: (url: string, content?: string, headers?: Headers) => boolean
  resolve: (
    url: string,
    content?: string,
    headers?: Headers,
    fetchFn?: FetchFn,
  ) => MaybePromise<Array<DiscoverUriEntry | DiscoverRef>>
  guessExclusionRegex?: RegExp
}
```

| Member | Description |
|--------|-------------|
| `match(url, content?, headers?)` | Returns `true` if this handler should process the URL |
| `resolve(url, content?, headers?, fetchFn?)` | Returns an array of [`DiscoverUriEntry`](/reference/types#discoverurientry) objects for the given page URL. A favicon handler can also return a [`DiscoverRef`](/reference/types#discoverref) for an icon that takes an extra request. See [Enriching Platform Icons](/other/favicons#enriching-platform-icons) |
| `guessExclusionRegex` | Matches the full URL of any user's feed on the platform's host. When the handler matches the page, the [Guess method](/feeds/guess) drops URLs matching it, unless the handler generated them. Set it on a platform where a path like `/feed.xml` can be the feed of a user named `feed` |

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
