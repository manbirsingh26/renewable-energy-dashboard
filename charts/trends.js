// ===== CHART 2: ENERGY SOURCE TRENDS LINE CHART =====

let trendsChart = null;

function drawTrends() {
  const ctx = document.getElementById("trendsChart").getContext("2d");

  // Get time series data for selected country
  const seriesData = getTimeSeriesForCountry(state.country);

  // Extract years and values
  const labels = seriesData.map(d => d.Year);

  // Filter by source selector
  const source = state.source;

  // Build datasets based on source filter
  const allDatasets = [
    {
      label: "☀️ Solar",
      data: seriesData.map(d => d.Solar_Share_Electricity_Pct != null
        ? parseFloat(d.Solar_Share_Electricity_Pct.toFixed(2)) : null),
      borderColor: "#f1c40f",
      backgroundColor: "rgba(241, 196, 15, 0.08)",
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: "#f1c40f",
      fill: true,
      tension: 0.4,
      hidden: source !== "all" && source !== "solar"
    },
    {
      label: "💨 Wind",
      data: seriesData.map(d => d.Wind_Share_Electricity_Pct != null
        ? parseFloat(d.Wind_Share_Electricity_Pct.toFixed(2)) : null),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.08)",
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: "#3b82f6",
      fill: true,
      tension: 0.4,
      hidden: source !== "all" && source !== "wind"
    },
    {
      label: "💧 Hydro",
      data: seriesData.map(d => d.Hydro_Share_Electricity_Pct != null
        ? parseFloat(d.Hydro_Share_Electricity_Pct.toFixed(2)) : null),
      borderColor: "#00e5a0",
      backgroundColor: "rgba(0, 229, 160, 0.08)",
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: "#00e5a0",
      fill: true,
      tension: 0.4,
      hidden: source !== "all" && source !== "hydro"
    },
    {
      label: "🌱 Total Renewables",
      data: seriesData.map(d => d.Renewables_Share_Electricity_Pct != null
        ? parseFloat(d.Renewables_Share_Electricity_Pct.toFixed(2)) : null),
      borderColor: "#ffffff",
      backgroundColor: "rgba(255,255,255, 0.03)",
      borderWidth: 2,
      borderDash: [6, 3],
      pointRadius: 2,
      pointHoverRadius: 5,
      pointBackgroundColor: "#ffffff",
      fill: false,
      tension: 0.4,
      hidden: source !== "all"
    }
  ];

  // Destroy previous chart if exists
  if (trendsChart) {
    trendsChart.destroy();
    trendsChart = null;
  }

  // Build chart
  trendsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: allDatasets
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
            font: { size: 11, family: "Inter" },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          backgroundColor: "#111827",
          borderColor: "#3b82f6",
          borderWidth: 1,
          titleColor: "#f1f5f9",
          bodyColor: "#94a3b8",
          padding: 12,
          callbacks: {
            title: ctx => `📅 Year: ${ctx[0].label}`,
            label: ctx => {
              const val = ctx.parsed.y;
              if (val == null) return null;
              return ` ${ctx.dataset.label}: ${val.toFixed(2)}%`;
            },
            footer: (items) => {
              const year = items[0]?.label;
              const yearRow = seriesData.find(d => d.Year == year);
              if (yearRow && yearRow.GHG_Emissions_MtCO2) {
                return `🌿 GHG: ${yearRow.GHG_Emissions_MtCO2.toFixed(1)} MtCO₂`;
              }
              return "";
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
            maxTicksLimit: 12
          },
          title:{
            display:true,
            text:"Year",
            color: "#7495c4",
            font:{size:11}
          }
        },
        y: {
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
            text: "Share of Electricity (%)",
            color: "#7495c4",
            font: { size: 11 }
          }
        }
      }
    }
  });
}