from playwright.sync_api import sync_playwright
import json
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Set viewport to see mobile/desktop layout
    page = browser.new_page(viewport={"width": 1280, "height": 1000})

    # Mock Data
    weather_data = {
        "current": {"temperature": 20, "weathercode": 0},
        "daily": [{"date": "2024-05-15", "max_temp": 25, "min_temp": 15, "weather_code": 0}],
        "hourly": [
            {"time": "2024-05-15T09:00", "temp": 18, "precip_prob": 0, "precip_amount": 0},
            {"time": "2024-05-15T10:00", "temp": 19, "precip_prob": 0, "precip_amount": 0},
            {"time": "2024-05-15T11:00", "temp": 20, "precip_prob": 0, "precip_amount": 0},
        ],
        "pollen": {}
    }

    steam_sales_data = [
        {"id": 1, "name": "Test Game", "image": "https://via.placeholder.com/460x215", "price": 1000, "original_price": 2000, "discount": 50, "link": "#"}
    ]

    # Intercept API calls
    def handle_weather(route):
        route.fulfill(status=200, body=json.dumps(weather_data), headers={"Content-Type": "application/json"})

    def handle_steam_sales(route):
        route.fulfill(status=200, body=json.dumps(steam_sales_data), headers={"Content-Type": "application/json"})

    def handle_empty(route):
         route.fulfill(status=200, body=json.dumps([]), headers={"Content-Type": "application/json"})

    def handle_dict(route):
        route.fulfill(status=200, body=json.dumps({}), headers={"Content-Type": "application/json"})

    page.route("**/api/weather*", handle_weather)
    page.route("**/api/steam/sales", handle_steam_sales)
    page.route("**/api/news*", handle_empty)
    page.route("**/api/steam/new", handle_empty)
    page.route("**/api/steam/popular", handle_empty)
    page.route("**/api/english*", handle_dict)

    # Go to page
    page.goto("http://localhost:8000")

    # Wait for content
    # Wait for weather
    page.wait_for_selector("#current-temp")

    # Wait a bit for Chart.js animation
    page.wait_for_timeout(2000)

    # Screenshot
    page.screenshot(path="verification/screenshot.png", full_page=True)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
