import requests
import random
import json
import os
import re

def load_words():
    """
    JSONファイルから単語リストを読み込む
    """
    try:
        path = os.path.join(os.path.dirname(__file__), 'business_words.json')
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('words', [])
    except Exception as e:
        print(f"Error loading words: {e}")
        # Fallback minimal list to prevent crash
        return [
            {"word": "agenda", "meaning_ja": "協議事項", "example": "The agenda is set."},
            {"word": "minutes", "meaning_ja": "議事録", "example": "Take the minutes."},
            {"word": "consensus", "meaning_ja": "合意", "example": "We reached a consensus."},
            {"word": "negotiate", "meaning_ja": "交渉する", "example": "We must negotiate."}
        ]

WORDS = load_words()

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
    if not WORDS:
        return {"error": "No words available"}

    word_entry = random.choice(WORDS)
    details = get_word_details(word_entry['word'])

    result = {
        "word": word_entry['word'],
        "meaning_ja": word_entry['meaning_ja'],
        "example": word_entry.get('example')
    }

    if details:
        # APIの詳細で更新するが、ローカルの例文がある場合は優先する
        local_example = result.get('example')
        result.update(details)
        if local_example:
            result['example'] = local_example

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

    # 例文の処理 (単語を隠す)
    example_hint = ""
    if correct.get('example'):
        word_esc = re.escape(correct['word'])
        # 大文字小文字を無視して置換
        example_hint = re.sub(word_esc, '_______', correct['example'], flags=re.IGNORECASE)

    return {
        "question": f"What is the meaning of '{correct['word']}'?",
        "correct_word": correct['word'], # フロントでの確認用
        "example": example_hint,
        "options": [
            {"label": w['meaning_ja'], "word": w['word'], "is_correct": (w['word'] == correct['word'])}
            for w in options
        ]
    }
