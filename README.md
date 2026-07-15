# renewable-energy-dashboard
# ⚡ Global Renewable Energy Adoption & Forecasting

An interactive data visualization dashboard exploring global renewable energy trends from 2000 to 2024, with forecasting to 2030.

## 🌐 Live Dashboard
👉 **[View Live Dashboard](https://manbirsingh26.github.io/renewable-energy-dashboard/)**

## 📊 Charts

| Chart | Type | Management Question |
|---|---|---|
| 🗺️ Choropleth Map | D3.js World Map | Which countries lead the clean energy transition? |
| 📈 Trends Chart | Chart.js Multi-line | Which renewable sources are growing fastest? |
| 🔮 Forecast Chart | Chart.js + Linear Regression | How much renewable energy by 2030? |
| 🌿 CO₂ Calculator | Chart.js + Live Slider | How much CO₂ can be avoided with higher adoption? |

## 🛠️ Tech Stack

- **D3.js v7** — Choropleth world map
- **Chart.js v4** — Line, forecast, and bar charts
- **PapaParse** — CSV data loading
- **TopoJSON** — World map topology
- **HTML/CSS/JavaScript** — Dashboard layout and interactivity

## 📁 Project Structure

```
renewable-energy-dashboard/
├── index.html          ← Main dashboard page
├── style.css           ← Dashboard styling
├── main.js             ← Data loading and shared state
├── charts/
│   ├── map.js          ← D3.js choropleth map
│   ├── trends.js       ← Energy source trends chart
│   ├── forecast.js     ← Forecast to 2030 chart
│   └── calculator.js   ← CO₂ reduction calculator
└── data/
    └── renewable_energy_cleaned.csv
```

## 📂 Data Source

- **Our World in Data** — Energy Data Repository
- Coverage: 213 countries, 2000–2024
- Source: IEA, Energy Institute & Ember Climate
- URL: https://github.com/owid/energy-data
