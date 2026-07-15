// ===== GLOBAL STATE =====
const state = {
  data: [],
  year: 2024,
  country: "World",
  source: "all"
};

// ===== LOAD CSV DATA =====
Papa.parse("data/renewable_energy_cleaned.csv", {
  download: true,
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  complete: function (results) {
    // Store data globally
    state.data = results.data;

    console.log(`✅ Loaded ${state.data.length} rows`);
    console.log("Sample row:", state.data[0]);

    // Populate country dropdown
    populateCountryDropdown();

    // Initial render of everything
    updateDashboard();
  },
  error: function (error) {
    console.error("❌ Error loading CSV:", error);
  }
});

// ===== POPULATE COUNTRY DROPDOWN =====
function populateCountryDropdown() {
  const select = document.getElementById("countrySelect");

  // Get unique countries sorted alphabetically
  const countries = [...new Set(state.data.map(d => d.Country))]
    .filter(c => c)
    .sort();

  // Add each country as an option
  countries.forEach(country => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    select.appendChild(option);
  });
}

// ===== GET FILTERED DATA =====
function getDataForYear(year) {
  return state.data.filter(d => d.Year === year);
}

function getDataForCountry(country) {
  if (country === "World") {
    // Return top 20 countries by renewable share for latest year
    return state.data
      .filter(d => d.Year === state.year && d.Renewables_Share_Electricity_Pct != null);
     
  }
  return state.data.filter(d => d.Country === country);
}

function getTimeSeriesForCountry(country) {
  if (country === "World") {
    // Aggregate world averages per year
    const years = [...new Set(state.data.map(d => d.Year))].sort();
    return years.map(year => {
      const yearData = state.data.filter(d => d.Year === year);
      return {
        Year: year,
        Solar_Share_Electricity_Pct: avg(yearData, "Solar_Share_Electricity_Pct"),
        Wind_Share_Electricity_Pct: avg(yearData, "Wind_Share_Electricity_Pct"),
        Hydro_Share_Electricity_Pct: avg(yearData, "Hydro_Share_Electricity_Pct"),
        Renewables_Share_Electricity_Pct: avg(yearData, "Renewables_Share_Electricity_Pct"),
        GHG_Emissions_MtCO2: sum(yearData, "GHG_Emissions_MtCO2"),
        Primary_Energy_Consumption_TWh: sum(yearData, "Primary_Energy_Consumption_TWh")
      };
    });
  }
  return state.data
    .filter(d => d.Country === country)
    .sort((a, b) => a.Year - b.Year);
}

// ===== HELPER FUNCTIONS =====
function avg(data, col) {
  const valid = data.filter(d => d[col] != null && !isNaN(d[col]));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, d) => sum + d[col], 0) / valid.length;
}

function sum(data, col) {
  return data
    .filter(d => d[col] != null && !isNaN(d[col]))
    .reduce((s, d) => s + d[col], 0);
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toFixed(1);
}

// ===== UPDATE KPI CARDS =====
function updateKPIs() {
  const yearData = getDataForYear(state.year);

  // Top country by renewable share
  const top = yearData
    .filter(d => d.Renewables_Share_Electricity_Pct != null)
    .sort((a, b) => b.Renewables_Share_Electricity_Pct - a.Renewables_Share_Electricity_Pct)[0];

  document.getElementById("kpi-leader").textContent =
    top ? `${top.Country} (${top.Renewables_Share_Electricity_Pct.toFixed(1)}%)` : "—";

  // Global average renewable %
  const avgRenewable = avg(yearData, "Renewables_Share_Electricity_Pct");
  document.getElementById("kpi-avg").textContent = avgRenewable.toFixed(1) + "%";

  // Average solar share
  const avgSolar = avg(yearData, "Solar_Share_Electricity_Pct");
  document.getElementById("kpi-solar").textContent = avgSolar.toFixed(1) + "%";

  // Total GHG emissions
  const totalGHG = sum(yearData, "GHG_Emissions_MtCO2");
  document.getElementById("kpi-co2").textContent = formatNumber(totalGHG);
}

// ===== MASTER UPDATE FUNCTION =====
function updateDashboard() {
  updateKPIs();
  if (typeof drawMap === "function") drawMap();
  if (typeof drawTrends === "function") drawTrends();
  if (typeof drawForecast === "function") drawForecast();
  if (typeof updateCalculator === "function") updateCalculator();
}

// ===== EVENT LISTENERS =====

// Year slider
document.getElementById("yearSlider").addEventListener("input", function () {
  state.year = parseInt(this.value);
  document.getElementById("yearLabel").textContent = state.year;
  updateDashboard();
});

// Country selector
document.getElementById("countrySelect").addEventListener("change", function () {
  state.country = this.value;
  updateDashboard();
});

// Source selector
document.getElementById("sourceSelect").addEventListener("change", function () {
  state.source = this.value;
  updateDashboard();
});