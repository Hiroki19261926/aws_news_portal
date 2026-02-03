import feedparser
from concurrent.futures import ThreadPoolExecutor
import time
from datetime import datetime
import re

# RSS Feed URLs
FEED_URLS = {
    'top': [
        'https://news.yahoo.co.jp/rss/topics/top-picks.xml'
    ],
    'tech': [
        'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',
        'https://www.publickey1.jp/atom.xml',
        'https://feeds.japan.cnet.com/rss/cnet/all.rdf'
    ],
    'gadget': [
        'https://gigazine.net/news/rss_2.0/',
        'https://www.watch.impress.co.jp/data/rss/1.0/ipw/feed.rdf'
    ],
    'game': [
        'https://www.4gamer.net/rss/news.xml',
        'https://www.famitsu.com/feed/'
    ],
    'indie': [
        'https://automaton-media.com/feed/',
        'https://www.gamespark.jp/feed/rss'
    ],
    'anime': [
        'https://www.animatetimes.com/rss/news.xml',
        'https://natalie.mu/comic/feed/news'
    ],
    'entertainment': [
        'https://natalie.mu/rss/all',
        'https://eiga.com/feed/'
    ]
}

def parse_feed(url):
    """
    RSSフィードをパースして標準形式のリストを返す
    """
    try:
        feed = feedparser.parse(url)
        entries = []
        for entry in feed.entries:
            # 公開日時の正規化
            published = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                published = entry.published_parsed
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                published = entry.updated_parsed

            pub_date = ""
            timestamp = 0
            if published:
                timestamp = time.mktime(published)
                pub_date = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

            # 画像の抽出 (feedparserが取得できた場合)
            image_url = None
            if hasattr(entry, 'links'):
                for link in entry.links:
                    if link.get('type', '').startswith('image/'):
                        image_url = link.get('href')
                        break

            # Media RSSのサムネイル対応 (media_content, media_thumbnail)
            if not image_url and hasattr(entry, 'media_content'):
                for media in entry.media_content:
                    if media.get('medium') == 'image':
                        image_url = media.get('url')
                        break
            if not image_url and hasattr(entry, 'media_thumbnail'):
                if len(entry.media_thumbnail) > 0:
                    image_url = entry.media_thumbnail[0].get('url')

            # 説明文(summary/description/content)から画像を抽出
            if not image_url:
                content_to_search = getattr(entry, 'summary', '') or getattr(entry, 'description', '')
                if hasattr(entry, 'content'):
                    for c in entry.content:
                        content_to_search += c.get('value', '')

                # <img src="..."> を検索
                img_match = re.search(r'<img[^>]+src=["\'](.*?)["\']', content_to_search, re.IGNORECASE)
                if img_match:
                    image_url = img_match.group(1)

            entries.append({
                'title': entry.title,
                'link': entry.link,
                'published': pub_date,
                'timestamp': timestamp,
                'summary': getattr(entry, 'summary', ''),
                'source': feed.feed.get('title', ''),
                'image': image_url
            })
        return entries
    except Exception as e:
        print(f"Error parsing {url}: {e}")
        return []

def fetch_news(category=None, keyword=None):
    """
    ニュースを取得するメイン関数
    category: 指定されたカテゴリのニュースを取得
    keyword: キーワードでフィルタリング (指定された場合は全カテゴリまたは指定カテゴリから検索)
    """
    urls = []

    # カテゴリ指定がある場合
    if category and category in FEED_URLS:
        urls = FEED_URLS[category]
    # キーワード検索でカテゴリ指定なしの場合、全フィード対象（重いが網羅性重視）
    elif keyword:
        for cat in FEED_URLS:
            urls.extend(FEED_URLS[cat])
    # デフォルトはトップニュース
    else:
        urls = FEED_URLS['top']

    # 並列処理でフィード取得
    all_entries = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(parse_feed, urls)
        for res in results:
            all_entries.extend(res)

    # 日付順にソート (新しい順)
    all_entries.sort(key=lambda x: x['timestamp'], reverse=True)

    # キーワードフィルタリング
    if keyword:
        keyword = keyword.lower()
        all_entries = [
            e for e in all_entries
            if keyword in e['title'].lower() or keyword in e['summary'].lower()
        ]

    # 必要のないフィールド（timestamp）を削除して返しても良いが、
    # フロントエンドでのソート等に使うかもしれないので残す
    return all_entries
