import requests
from datetime import datetime
import json

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

    # 1. 天気予報 (Weather Forecast)
    weather_url = "https://api.open-meteo.com/v1/forecast"
    weather_params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": "true",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
        "hourly": "temperature_2m,precipitation_probability,precipitation",
        "timezone": "Asia/Tokyo"
    }

    result = {}

    try:
        response = requests.get(weather_url, params=weather_params, timeout=5)
        response.raise_for_status()
        data = response.json()

        result["current"] = data.get("current_weather", {})

        # Daily processing
        result["daily"] = []
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

        # Hourly processing (Next 24 hours)
        result["hourly"] = []
        hourly = data.get("hourly", {})
        if hourly:
            times = hourly.get("time", [])
            temps = hourly.get("temperature_2m", [])
            probs = hourly.get("precipitation_probability", [])
            amounts = hourly.get("precipitation", [])

            # Simple slice: first 24 hours provided by API (starts from 00:00 today usually)
            # Or we could try to find current hour. Open-Meteo returns history + forecast.
            # We'll just take the first 24 entries which represent "Today" usually,
            # or if we want "from now", we'd need to parse time.
            # Let's return the first 24 hours of data returned (which is usually today 00:00 to 23:00)
            count = min(len(times), 24)
            for i in range(count):
                result["hourly"].append({
                    "time": times[i],
                    "temp": temps[i] if i < len(temps) else None,
                    "precip_prob": probs[i] if i < len(probs) else None,
                    "precip_amount": amounts[i] if i < len(amounts) else None
                })

    except Exception as e:
        print(f"Error fetching weather: {e}")
        return {"error": str(e)}

    # 2. 花粉情報 (Pollen / Air Quality)
    # Open-Meteo Air Quality API
    # Note: Pollen data is primarily for Europe in Open-Meteo. Japan specific pollen (Cedar/Cypress) might not be available or requires specific endpoint.
    # We will use standard types. If data is not available for Japan, it may return nulls or 0.
    pollen_url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    pollen_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen",
        "timezone": "Asia/Tokyo"
    }

    try:
        p_response = requests.get(pollen_url, params=pollen_params, timeout=5)
        p_response.raise_for_status()
        p_data = p_response.json()

        result["pollen"] = {}

        hourly_pollen = p_data.get("hourly", {})
        if hourly_pollen:
            # Calculate max for today (first 24 hours) for each type
            pollen_types = [
                "alder_pollen", "birch_pollen", "grass_pollen", "mugwort_pollen",
                "olive_pollen", "ragweed_pollen"
            ]

            for p_type in pollen_types:
                values = hourly_pollen.get(p_type, [])
                # Take max of first 24 hours
                today_values = values[:24] if values else []
                # Filter out None values
                valid_values = [v for v in today_values if v is not None]
                max_val = max(valid_values) if valid_values else 0
                result["pollen"][p_type] = max_val

    except Exception as e:
        print(f"Error fetching pollen: {e}")
        result["pollen_error"] = str(e)
        # Non-critical, continue

    return result
