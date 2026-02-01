import json
import news
import weather
import steam
import english

def handler(event, context):
    """
    Lambdaメインハンドラー
    API Gatewayからのリクエストを各モジュールに振り分ける
    """
    # HTTP API (v2) or REST API (v1) compatibility
    path = event.get('rawPath') or event.get('path', '/')
    method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}

    # CORS Headers
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    # Handle Preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }

    try:
        body = {}

        # Routing logic

        # News
        if path.endswith('/news'):
            category = query_params.get('category')
            body = news.fetch_news(category=category)
        elif path.endswith('/news/search'):
            keyword = query_params.get('q')
            body = news.fetch_news(keyword=keyword)

        # Weather
        elif path.endswith('/weather'):
            lat = query_params.get('lat')
            lon = query_params.get('lon')
            body = weather.get_weather(lat=lat, lon=lon)

        # Steam
        elif path.endswith('/steam/sales'):
            info = steam.get_steam_info()
            body = info.get('sales', [])
        elif path.endswith('/steam/new'):
            info = steam.get_steam_info()
            body = info.get('new_releases', [])
        elif path.endswith('/steam/popular'):
            info = steam.get_steam_info()
            body = info.get('top_sellers', [])

        # English
        elif path.endswith('/english/word'):
            body = english.get_word_of_the_day()
        elif path.endswith('/english/quiz'):
            body = english.get_quiz()

        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Not Found', 'path': path})
            }

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(body, ensure_ascii=False)
        }

    except Exception as e:
        print(f"Error handling request: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
