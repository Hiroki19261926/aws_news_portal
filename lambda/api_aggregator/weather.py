import requests
from datetime import datetime

def get_weather(lat=None, lon=None):
    """
    Open-Meteo APIから天気情報を取得する
    デフォルトは東京 (35.6895, 139.6917)
    """
    if lat is None:
        lat = 35.6895
    if lon is None:
        lon = 139.6917

    # 文字列できた場合に対応
    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return {"error": "Invalid latitude or longitude"}

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": "true",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
        "timezone": "Asia/Tokyo"
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        # レスポンスの整形
        result = {
            "current": data.get("current_weather", {}),
            "daily": []
        }

        daily = data.get("daily", {})
        if daily:
            times = daily.get("time", [])
            max_temps = daily.get("temperature_2m_max", [])
            min_temps = daily.get("temperature_2m_min", [])
            precip_probs = daily.get("precipitation_probability_max", [])
            weather_codes = daily.get("weathercode", [])

            for i in range(len(times)):
                result["daily"].append({
                    "date": times[i],
                    "max_temp": max_temps[i] if i < len(max_temps) else None,
                    "min_temp": min_temps[i] if i < len(min_temps) else None,
                    "precip_prob": precip_probs[i] if i < len(precip_probs) else None,
                    "weather_code": weather_codes[i] if i < len(weather_codes) else None
                })

        return result

    except Exception as e:
        print(f"Error fetching weather: {e}")
        return {"error": str(e)}
