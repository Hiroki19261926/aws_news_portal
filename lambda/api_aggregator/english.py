import requests
import random
import json

# ビジネス英単語リスト (30語以上)
WORDS = [
    {"word": "agenda", "meaning_ja": "協議事項、議題"},
    {"word": "minutes", "meaning_ja": "議事録"},
    {"word": "consensus", "meaning_ja": "合意"},
    {"word": "negotiate", "meaning_ja": "交渉する"},
    {"word": "proposal", "meaning_ja": "提案"},
    {"word": "strategy", "meaning_ja": "戦略"},
    {"word": "implement", "meaning_ja": "実行する、導入する"},
    {"word": "deadline", "meaning_ja": "締め切り"},
    {"word": "milestone", "meaning_ja": "マイルストーン、節目"},
    {"word": "objective", "meaning_ja": "目的、目標"},
    {"word": "revenue", "meaning_ja": "収益"},
    {"word": "profit", "meaning_ja": "利益"},
    {"word": "budget", "meaning_ja": "予算"},
    {"word": "asset", "meaning_ja": "資産"},
    {"word": "liability", "meaning_ja": "負債"},
    {"word": "equity", "meaning_ja": "株式、自己資本"},
    {"word": "dividend", "meaning_ja": "配当"},
    {"word": "merger", "meaning_ja": "合併"},
    {"word": "acquisition", "meaning_ja": "買収"},
    {"word": "stakeholder", "meaning_ja": "利害関係者"},
    {"word": "incentive", "meaning_ja": "報奨、インセンティブ"},
    {"word": "productivity", "meaning_ja": "生産性"},
    {"word": "efficiency", "meaning_ja": "効率"},
    {"word": "collaboration", "meaning_ja": "協力、共同作業"},
    {"word": "innovation", "meaning_ja": "革新"},
    {"word": "benchmark", "meaning_ja": "基準、指標"},
    {"word": "forecast", "meaning_ja": "予測"},
    {"word": "quarter", "meaning_ja": "四半期"},
    {"word": "fiscal", "meaning_ja": "会計の、財政の"},
    {"word": "compliance", "meaning_ja": "法令遵守"},
    {"word": "regulation", "meaning_ja": "規制"},
    {"word": "audit", "meaning_ja": "監査"},
    {"word": "recruit", "meaning_ja": "採用する"},
    {"word": "turnover", "meaning_ja": "離職率、売上高"}
]

def get_word_details(word):
    """
    Free Dictionary APIから単語の詳細を取得
    """
    url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                entry = data[0]
                meanings = entry.get('meanings', [])
                definition = "No definition found."
                example = None

                # 最初の定義と例文を取得
                for m in meanings:
                    for d in m.get('definitions', []):
                        if not definition or definition == "No definition found.":
                            definition = d.get('definition')
                        if 'example' in d:
                            example = d.get('example')
                        if definition and example:
                            break
                    if definition and example:
                        break

                # 音声URLの取得
                audio = None
                for phon in entry.get('phonetics', []):
                    if phon.get('audio'):
                        audio = phon.get('audio')
                        break

                return {
                    "word": entry.get('word'),
                    "phonetic": entry.get('phonetic'),
                    "definition": definition,
                    "example": example,
                    "audio": audio
                }
    except Exception as e:
        print(f"Error fetching word details: {e}")

    return None

def get_word_of_the_day():
    """
    ランダムに単語を選び、詳細情報を付加して返す
    """
    word_entry = random.choice(WORDS)
    details = get_word_details(word_entry['word'])

    result = {
        "word": word_entry['word'],
        "meaning_ja": word_entry['meaning_ja']
    }

    if details:
        result.update(details)

    return result

def get_quiz():
    """
    4択クイズを生成する
    """
    if len(WORDS) < 4:
        return {"error": "Not enough words for quiz"}

    correct = random.choice(WORDS)
    # 正解以外の単語から3つ選ぶ
    others = random.sample([w for w in WORDS if w['word'] != correct['word']], 3)

    options = others + [correct]
    random.shuffle(options)

    return {
        "question": f"What is the meaning of '{correct['word']}'?",
        "correct_word": correct['word'], # フロントでの確認用
        "options": [
            {"label": w['meaning_ja'], "word": w['word'], "is_correct": (w['word'] == correct['word'])}
            for w in options
        ]
    }
