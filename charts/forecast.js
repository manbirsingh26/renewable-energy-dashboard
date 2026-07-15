// ===== CHART 3: RENEWABLE ENERGY FORECAST TO 2030 =====

let forecastChart = null;

function drawForecast() {
  const ctx = document.getElementById("forecastChart").getContext("2d");

  // Get time series for selected country
  const seriesData = getTimeSeriesForCountry(state.country);

  // Use Renewables_Share_Electricity_Pct for forecasting
  const historicalData = seriesData
    .filter(d => d.Renewables_Share_Electricity_Pct != null)
    .map(d => ({
      x: d.Year,
      y: parseFloat(d.Renewables_Share_Electricity_Pct.toFixed(2))
    }));

  if (historicalData.length < 3) return;

  // ===== LINEAR REGRESSION =====
  function linearRegression(data) {
    const n = data.length;
    const sumX  = data.reduce((s, d) => s + d.x, 0);
    const sumY  = data.reduce((s, d) => s + d.y, 0);
    const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
    const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
    const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }

  const { slope, intercept } = linearRegression(historicalData);

  // ===== GENERATE FORECAST YEARS 2025-2030 =====
  const forecastYears = [2025, 2026, 2027, 2028, 2029, 2030];
  const forecastData  = forecastYears.map(year => ({
    x: year,
    y: Math.min(100, Math.max(0, parseFloat((slope * year + intercept).toFixed(2))))
  }));

  // ===== CONFIDENCE BAND (±1 std dev) =====
  const residuals = historicalData.map(d => d.y - (slope * d.x + intercept));
  const stdDev    = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length);

  const upperBand = forecastData.map(d => ({
    x: d.x,
    y: Math.min(100, parseFloat((d.y + stdDev).toFixed(2)))
  }));
  const lowerBand = forecastData.map(d => ({
    x: d.x,
    y: Math.max(0, parseFloat((d.y - stdDev).toFixed(2)))
  }));

  // ===== BUILD CHART LABELS =====
  const historicalYears = historicalData.map(d => d.x);
  const allYears        = [...historicalYears, ...forecastYears];

  // Historical values + null for forecast years
  const historicalLine = [
    ...historicalData.map(d => d.y),
    ...forecastYears.map(() => null)
  ];

  // null for historical years + forecast values
  const forecastLine = [
    ...historicalData.map((d, i) =>
      i === historicalData.length - 1 ? d.y : null),
    ...forecastData.map(d => d.y)
  ];

  // Upper confidence band
  const upperLine = [
    ...historicalData.map(() => null),
    ...upperBand.map(d => d.y)
  ];

  // Lower confidence band
  const lowerLine = [
    ...historicalData.map(() => null),
    ...lowerBand.map(d => d.y)
  ];

  // 2030 target reference line (30% global target)
  const targetValue = 60;
  const targetLine  = allYears.map(() => targetValue);

  // ===== DESTROY PREVIOUS CHART =====
  if (forecastChart) {
    forecastChart.destroy();
    forecastChart = null;
  }

  
  forecastChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: allYears,
      datasets: [
        // Historical line
        {
          label: "📊 Historical Data",
          data: historicalLine,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(0, 229, 160, 0.06)",
          pointStyle: "rectRot",
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#3b82f6",
          fill: true,
          tension: 0.4,
          spanGaps: false
        },
        // Forecast line
        {
          label: "🔮 Forecast",
          data: forecastLine,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.06)",
          borderWidth: 2.5,
          borderDash: [8, 4],
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: "#f59e0b",
          pointStyle: "triangle",
          fill: false,
          tension: 0.4,
          spanGaps: false
        },
        // Upper confidence band
        {
          label: "📈 Upper Confidence Band",
          data: upperLine,
          borderColor: "rgba(245, 158, 11, 0.25)",
          backgroundColor: "rgba(245, 158, 11, 0.08)",
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: "+1",
          tension: 0.4,
          spanGaps: false
        },
        // Lower confidence band
        {
          label: "📉 Lower Confidence Band",
          data: lowerLine,
          borderColor: "rgba(245, 158, 11, 0.25)",
          backgroundColor: "rgba(245, 158, 11, 0.08)",
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
          tension: 0.4,
          spanGaps: false
        },
        // 60% target reference line
        {
          label: "🎯 60% Global Target",
          data: targetLine,
          borderColor: "#ef4444",
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#94a3b8",
            font: { size: 10, family: "Inter" },
            padding: 12,
            usePointStyle: true,
            filter: item =>
              item.text !== "📈 Upper Confidence Band" &&
              item.text !== "📉 Lower Confidence Band"
          }
        },
        tooltip: {
          backgroundColor: "#111827",
          borderColor: "#f59e0b",
          borderWidth: 1,
          titleColor: "#f1f5f9",
          bodyColor: "#94a3b8",
          padding: 12,
          callbacks: {
            title: ctx => {
              const year = ctx[0].label;
              return year >= 2025
                ? `🔮 Forecast Year: ${year}`
                : `📊 Historical Year: ${year}`;
            },
            label: ctx => {
              const val = ctx.parsed.y;
              if (val == null) return null;
              const label = ctx.dataset.label;
              if (label.includes("Upper") || label.includes("Lower")) return null;
              if (label.includes("Target")) return ` 🎯 Target: ${val}%`;
              return ` ${label}: ${val.toFixed(2)}%`;
            },
            footer: ctx => {
              const year = ctx[0]?.label;
              if (year >= 2025) {
                const forecastVal = forecastData.find(d => d.x == year);
                if (forecastVal) {
                  const upper = Math.min(100, forecastVal.y + stdDev).toFixed(1);
                  const lower = Math.max(0,   forecastVal.y - stdDev).toFixed(1);
                  return `📊 Confidence Range: ${lower}% – ${upper}%`;
                }
              }
              return "";
            }
          }
        },
        // Vertical line annotation for 2025
        annotation: {
          annotations: {
            splitLine: {
              type: "line",
              xMin: 2024.5,
              xMax: 2024.5,
              borderColor: "rgba(255,255,255,0.2)",
              borderWidth: 1,
              borderDash: [4, 4],
              label: {
                display: true,
                content: "Forecast →",
                color: "#94a3b8",
                font: { size: 9 }
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: "rgba(255,255,255,0.04)",
            drawBorder: false
          },
          ticks: {
            color: "#7495c4",
            font: { size: 11 },
            maxTicksLimit: 15
          },
          title:{
            display: true,
            text:"Year",
            color:"#7495c4",
            font:{size:11}
          }
        },
        y: {
          min: 0,
          max: 100,
          grid: {
            color: "rgba(255,255,255,0.04)",
            drawBorder: false
          },
          ticks: {
            color: "#7495c4",
            font: { size: 11 },
            callback: val => val + "%"
          },
          title: {
            display: true,
            text: "Renewable Share of Electricity (%)",
            color: "#7495c4",
            font: { size: 11 }
          }
        }
      }
    }
  });
}