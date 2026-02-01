import requests

def get_steam_info():
    """
    Steam Store APIから情報を取得する
    セール、新作、人気ゲームを取得
    """
    url = "https://store.steampowered.com/api/featuredcategories"
    params = {
        "l": "japanese",
        "cc": "JP"
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        result = {
            "sales": [],
            "new_releases": [],
            "top_sellers": []
        }

        # 各カテゴリのデータを抽出
        # specials: セール
        if 'specials' in data:
            result['sales'] = extract_games(data['specials'].get('items', []))

        # new_releases: 新作
        if 'new_releases' in data:
            result['new_releases'] = extract_games(data['new_releases'].get('items', []))

        # top_sellers: 人気
        if 'top_sellers' in data:
            result['top_sellers'] = extract_games(data['top_sellers'].get('items', []))

        return result

    except Exception as e:
        print(f"Error fetching Steam info: {e}")
        return {"error": str(e)}

def extract_games(items):
    """
    ゲームリストから必要な情報を抽出する
    """
    games = []
    for item in items:
        # 価格は通常セント単位（または最小通貨単位）
        price = item.get('final_price', 0)
        original_price = item.get('original_price', 0)

        # Steam APIは価格を通貨の最小単位（例: セント）で返すため、通常100で割る必要がある。
        # 日本円の場合もシステム内部では同様に扱われることが多いため、/100を行う。

        games.append({
            "id": item.get('id'),
            "name": item.get('name'),
            "image": item.get('large_capsule_image'),
            "price": price / 100 if price else 0,
            "original_price": original_price / 100 if original_price else 0,
            "discount": item.get('discount_percent', 0),
            "link": f"https://store.steampowered.com/app/{item.get('id')}/"
        })
    return games
