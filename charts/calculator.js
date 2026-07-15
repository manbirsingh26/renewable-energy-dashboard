// ===== CHART 4: CO2 REDUCTION CALCULATOR =====

let calculatorChart = null;

function updateCalculator() {
  const slider = document.getElementById("renewableTarget");
  // Ensure slider min is always respected
  const targetPct = parseFloat(slider.value);

  // Update slider label
  document.getElementById("targetPct").textContent = targetPct + "%";

  // Get data for selected country and year
  const yearData = getDataForYear(state.year);

  // Calculate current values
  let currentRenewablePct, totalEnergyTWh, currentGHG;

  if (state.country === "World") {
    currentRenewablePct = avg(yearData, "Renewables_Share_Electricity_Pct");
    totalEnergyTWh      = sum(yearData, "Primary_Energy_Consumption_TWh");
    currentGHG          = sum(yearData, "GHG_Emissions_MtCO2");
  } else {
    const countryData   = yearData.find(d => d.Country === state.country);
    if (!countryData) return;
    currentRenewablePct = countryData.Renewables_Share_Electricity_Pct || 0;
    totalEnergyTWh      = countryData.Primary_Energy_Consumption_TWh   || 0;
    currentGHG          = countryData.GHG_Emissions_MtCO2              || 0;
  }

  // ===== CO2 CALCULATION =====
  // Each 1 TWh of fossil fuel electricity emits ~0.82 MtCO2 (IEA average)
  const CO2_PER_TWH = 0.82;

  // Calculate difference between target and current
  // Positive = improvement, Negative = reduction
  const additionalRenewablePct = targetPct - currentRenewablePct;

  // TWh of fossil fuel displaced (positive) or added (negative)
  const fossilDisplacedTWh = (additionalRenewablePct / 100) * totalEnergyTWh;

  // CO2 avoided (positive = savings, negative = increase)
  const co2Avoided = fossilDisplacedTWh * CO2_PER_TWH;

  // Equivalent cars removed from roads
  const carsRemoved = Math.abs((co2Avoided * 1000000) / 4.6);

  // Equivalent homes powered
  const homesPowered = Math.abs(fossilDisplacedTWh / 0.0000105);

  // ===== UPDATE KPI RESULTS =====
  const isReduction  = targetPct < currentRenewablePct;
  const isNoChange   = targetPct === Math.round(currentRenewablePct);

  // CO2 label changes based on whether target is above or below current
  const co2Label     = isReduction ? "MtCO₂ Increase" : "MtCO₂ Avoided";
  const carsLabel    = isReduction ? "Cars Added" : "Cars Removed";
  const homesLabel   = isReduction ? "Homes Without Clean Energy" : "Homes Powered With Clean Energy";

  document.getElementById("co2Saved").textContent =
    isNoChange ? "No Change" :
    Math.abs(co2Avoided).toFixed(1) + " " + co2Label;

  document.getElementById("carsRemoved").textContent =
    isNoChange ? "No Change" : formatNumber(carsRemoved) + " " + (isReduction ? "Added" : "Removed");

  document.getElementById("homesPowd").textContent =
    isNoChange ? "No Change" : formatNumber(homesPowered);

  // Update labels dynamically
  document.querySelectorAll(".calc-result-label")[0].textContent = co2Label.toUpperCase();
  document.querySelectorAll(".calc-result-label")[1].textContent = carsLabel.toUpperCase();
  document.querySelectorAll(".calc-result-label")[2].textContent = homesLabel.toUpperCase();

  // ===== BUILD CHART =====
  const ctx = document.getElementById("calculatorChart").getContext("2d");

  if (calculatorChart) {
    calculatorChart.destroy();
    calculatorChart = null;
  }

  // Current vs Target comparison bars
  const currentFossilPct  = Math.max(0, 100 - currentRenewablePct);
  const targetFossilPct   = Math.max(0.1, 100 - targetPct);
  const currentCO2        = currentGHG;
  const rawTargetCO2      = currentGHG - co2Avoided;
  const targetCO2         = Math.max(0.1, rawTargetCO2);

  calculatorChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Current State", "Target State"],
      datasets: [
        {
          label: "🌱 Renewable %",
          data: [
            parseFloat(currentRenewablePct.toFixed(1)),
            parseFloat(targetPct.toFixed(1))
          ],
          backgroundColor: [
            "rgba(0, 229, 160, 0.7)",
            "rgba(0, 229, 160, 1)"
          ],
          borderColor: ["#00e5a0", "#00e5a0"],
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: "y"
        },
        {
          label: "🏭 Fossil Fuel %",
          data: [
            parseFloat(currentFossilPct.toFixed(1)),
            parseFloat(targetFossilPct.toFixed(1))
          ],
          backgroundColor: [
            "rgba(239, 68, 68, 0.7)",
            "rgba(239, 68, 68, 0.4)"
          ],
          borderColor: ["#ef4444", "#ef4444"],
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: "y"
        },
        {
          label: "🌿 GHG Emissions (MtCO₂)",
          data: [
            parseFloat(currentCO2.toFixed(1)),
            parseFloat(targetCO2.toFixed(1))
          ],
          backgroundColor: [
            "rgba(245, 158, 11, 0.7)",
            "rgba(245, 158, 11, 0.3)"
          ],
          borderColor: ["#f59e0b", "#f59e0b"],
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: "y1"
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
            usePointStyle: true
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
            title: ctx => ctx[0].label,
            label: ctx => {
              const val = ctx.parsed.y;
              if (ctx.dataset.label.includes("GHG")) {
                return ` ${ctx.dataset.label}: ${val.toFixed(1)} MtCO₂`;
              }
              return ` ${ctx.dataset.label}: ${val.toFixed(1)}%`;
            },
            footer: ctx => {
              const isTarget = ctx[0].label === "Target State";
              if (isTarget && co2Avoided > 0) {
                return `💡 CO₂ Saved: ${co2Avoided.toFixed(1)} MtCO₂`;
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
            color: "#94a3b8",
            font: { size: 11, family: "Inter" }
          }
        },
        y: {
          type: "linear",
          position: "left",
          min: 0,
          max: 100,
          grid: {
            color: "rgba(255,255,255,0.04)",
            drawBorder: false
          },
          ticks: {
            color: "#7495c4",
            font: { size: 10 },
            callback: val => val + "%"
          },
          title: {
            display: true,
            text: "Energy Share (%)",
            color: "#7495c4",
            font: { size: 10 }
          }
        },
        y1: {
          type: "linear",
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: {
            color: "#f59e0b",
            font: { size: 10 },
            callback: val => val.toFixed(0) + " Mt"
          },
          title: {
            display: true,
            text: "GHG Emissions (MtCO₂)",
            color: "#f59e0b",
            font: { size: 10 }
          }
        }
      }
    }
  });
}

// ===== SLIDER EVENT LISTENER =====
document.getElementById("renewableTarget").addEventListener("input", function() {
  updateCalculator();
});