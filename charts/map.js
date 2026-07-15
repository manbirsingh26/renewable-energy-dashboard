// ===== CHART 1: D3.JS CHOROPLETH MAP =====

let mapSvg = null;
let worldData = null;
let tooltip = null;

// ISO Alpha-3 to Numeric ID mapping
const alpha3ToNumeric = {
  "AFG":"004","ALB":"008","DZA":"012","AND":"020","AGO":"024","ATG":"028","ARG":"032","ARM":"051",
  "AUS":"036","AUT":"040","AZE":"031","BHS":"044","BHR":"048","BGD":"050","BRB":"052","BLR":"112",
  "BEL":"056","BLZ":"084","BEN":"204","BTN":"064","BOL":"068","BIH":"070","BWA":"072","BRA":"076",
  "BRN":"096","BGR":"100","BFA":"854","BDI":"108","CPV":"132","KHM":"116","CMR":"120",
  "CAN":"124","CAF":"140","TCD":"148","CHL":"152","CHN":"156","COL":"170","COM":"174",
  "COD":"180","COG":"178","CRI":"188","CIV":"384","HRV":"191","CUB":"192","CYP":"196",
  "CZE":"203","DNK":"208","DJI":"262","DOM":"214","ECU":"218","EGY":"818","SLV":"222",
  "GNQ":"226","ERI":"232","EST":"233","SWZ":"748","ETH":"231","FJI":"242","FIN":"246",
  "FRA":"250","GAB":"266","GMB":"270","GEO":"268","DEU":"276","GHA":"288","GRC":"300",
  "GTM":"320","GIN":"324","GNB":"624","GUY":"328","HTI":"332","HND":"340","HUN":"348",
  "ISL":"352","IND":"356","IDN":"360","IRN":"364","IRQ":"368","IRL":"372","ISR":"376",
  "ITA":"380","JAM":"388","JPN":"392","JOR":"400","KAZ":"398","KEN":"404","PRK":"408",
  "KOR":"410","KWT":"414","KGZ":"417","LAO":"418","LVA":"428","LBN":"422","LSO":"426",
  "LBR":"430","LBY":"434","LIE":"438","LTU":"440","LUX":"442","MDG":"450","MWI":"454",
  "MYS":"458","MDV":"462","MLI":"466","MLT":"470","MRT":"478","MUS":"480","MEX":"484",
  "MDA":"498","MCO":"492","MNG":"496","MNE":"499","MAR":"504","MOZ":"508","MMR":"104",
  "NAM":"516","NPL":"524","NLD":"528","NZL":"554","NIC":"558","NER":"562","NGA":"566",
  "MKD":"807","NOR":"578","OMN":"512","PAK":"586","PAN":"591","PNG":"598","PRY":"600",
  "PER":"604","PHL":"608","POL":"616","PRT":"620","QAT":"634","ROU":"642","RUS":"643",
  "RWA":"646","SAU":"682","SEN":"686","SRB":"688","SLE":"694","SGP":"702","SVK":"703",
  "SVN":"705","SOM":"706","ZAF":"710","SSD":"728","ESP":"724","LKA":"144","SDN":"729",
  "SUR":"740","SWE":"752","CHE":"756","SYR":"760","TWN":"158","TJK":"762","TZA":"834",
  "THA":"764","TLS":"626","TGO":"768","TTO":"780","TUN":"788","TUR":"792","TKM":"795",
  "UGA":"800","UKR":"804","ARE":"784","GBR":"826","USA":"840","URY":"858","UZB":"860",
  "VEN":"862","VNM":"704","YEM":"887","ZMB":"894","ZWE":"716",
  "GRL":"304","HKG":"344","PRI":"630","PSE":"275","TWN":"158",
  "ABW":"533","ASM":"016","BMU":"060","COK":"184","CYM":"136",
  "DMA":"212","ESH":"732","FLK":"238","FRO":"234","GIB":"292",
  "GLP":"312","GRD":"308","GUF":"254","GUM":"316","KIR":"296",
  "KNA":"659","LCA":"662","MAC":"446","MSR":"500","MTQ":"474",
  "NCL":"540","NRU":"520","REU":"638","SHN":"654","SLB":"090",
  "SPM":"666","STP":"678","SYC":"690","TCA":"796","TON":"776",
  "VCT":"670","VGB":"092","VIR":"850","VUT":"548","WSM":"882"
};

// Build reverse lookup: numeric -> alpha3
// world-atlas stores IDs as numbers e.g. 4 for Afghanistan
// We pad them to 3 digits e.g. "004" to match our mapping
const numericToAlpha3 = {};
Object.entries(alpha3ToNumeric).forEach(([alpha3, numeric]) => {
  numericToAlpha3[numeric] = alpha3;
});

// ===== COLORFUL THRESHOLD SCALE =====
function getColor(value) {
  if (value == null) return "#1e2d45";
  if (value < 10)  return "#c0392b";
  if (value < 20)  return "#e74c3c";
  if (value < 30)  return "#e67e22";
  if (value < 40)  return "#f39c12";
  if (value < 50)  return "#f1c40f";
  if (value < 60)  return "#2ecc71";
  if (value < 75)  return "#27ae60";
  return "#1a8a4a";
}

// ===== DRAW MAP =====
async function drawMap() {
  const container = document.getElementById("map-container");
  const width = container.clientWidth || 700;
  const height = 380;

  // Load world topology only once
  if (!worldData) {
    try {
      worldData = await d3.json(
        "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
      );
    } catch (e) {
      console.error("Failed to load world map:", e);
      return;
    }
  }

  // Clear previous map
  d3.select("#map-container").selectAll("*").remove();
  d3.select(".map-tooltip").remove();

  // Create tooltip
  tooltip = d3.select("body")
    .append("div")
    .attr("class", "map-tooltip")
    .style("position", "absolute")
    .style("background", "#111827")
    .style("border", "1px solid #00e5a0")
    .style("border-radius", "10px")
    .style("padding", "10px 14px")
    .style("font-size", "0.78rem")
    .style("color", "#f1f5f9")
    .style("pointer-events", "none")
    .style("z-index", "9999")
    .style("display", "none")
    .style("line-height", "1.8")
    .style("box-shadow", "0 4px 20px rgba(0,0,0,0.5)");

  // Get data for selected year
  const yearData = getDataForYear(state.year);

  // Build ISO lookup — calculate Others % here
  const dataByISO = {};
  yearData.forEach(d => {
    if (d.ISO_Code && d.Renewables_Share_Electricity_Pct != null) {

      const total  = d.Renewables_Share_Electricity_Pct || 0;
      const solar  = d.Solar_Share_Electricity_Pct      || 0;
      const wind   = d.Wind_Share_Electricity_Pct       || 0;
      const hydro  = d.Hydro_Share_Electricity_Pct      || 0;

      // Others = Total Renewables - (Solar + Wind + Hydro)
      // Clamp to 0 so it never goes negative due to rounding
      const others = Math.max(0, total - solar - wind - hydro);

      dataByISO[d.ISO_Code] = {
        value:   total,
        country: d.Country,
        solar:   solar,
        wind:    wind,
        hydro:   hydro,
        others:  others,
        ghg:     d.GHG_Emissions_MtCO2 || 0
      };
    }
  });

  // Projection
  const projection = d3.geoNaturalEarth1()
    .scale(width / 5.8)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // Create SVG
  mapSvg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Ocean background
  mapSvg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#0d1b2e")
    .attr("rx", 8);

  // Convert TopoJSON -> GeoJSON
  const countries = topojson.feature(worldData, worldData.objects.countries);

  // Draw countries
  mapSvg.selectAll(".country")
    .data(countries.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", d => {
      const alpha3 = numericToAlpha3[String(d.id).padStart(3, '0')];
      const info = alpha3 ? dataByISO[alpha3] : null;
      return getColor(info ? info.value : null);
    })
    .attr("stroke", "#0a0f1e")
    .attr("stroke-width", 0.5)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      const alpha3 = numericToAlpha3[String(d.id).padStart(3, '0')];
      const info = alpha3 ? dataByISO[alpha3] : null;

      d3.select(this)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .style("filter", "brightness(1.3)");

      if (info) {
        // Verify totals add up perfectly
        const checkTotal = (info.solar + info.wind + info.hydro + info.others).toFixed(1);

        tooltip
          .style("display", "block")
          .html(`
            <div style="color:#00e5a0;font-weight:700;font-size:0.88rem;margin-bottom:6px;">
              ${info.country}
            </div>
            <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;align-items:center;">
              <span>☀️ Solar</span>      <strong>${info.solar.toFixed(1)}%</strong>
              <span>💨 Wind</span>       <strong>${info.wind.toFixed(1)}%</strong>
              <span>💧 Hydro</span>      <strong>${info.hydro.toFixed(1)}%</strong>
              <span>🌿 Others</span>     <strong>${info.others.toFixed(1)}%</strong>
            </div>
            <div style="border-top:1px solid #1e2d45;margin-top:6px;padding-top:6px;
                        display:grid;grid-template-columns:auto 1fr;gap:2px 12px;">
              <span style="color:#00e5a0;">🌱 Total Renewables</span>
              <strong style="color:#00e5a0;">${info.value.toFixed(1)}%</strong>
              <span>🌿 GHG Emissions</span>
              <strong>${info.ghg.toFixed(1)} MtCO₂</strong>
            </div>
          `);
      } else {
        tooltip
          .style("display", "block")
          .html(`<div style="color:#94a3b8;font-style:italic;">No significant data available</div>`);
      }
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 50) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("stroke", "#0a0f1e")
        .attr("stroke-width", 0.5)
        .style("filter", "brightness(1)");
      tooltip.style("display", "none");
    })
    .on("click", function(event, d) {
      const alpha3 = numericToAlpha3[String(d.id).padStart(3, '0')];
      const info = alpha3 ? dataByISO[alpha3] : null;
      if (info) {
        const select = document.getElementById("countrySelect");
        select.value = info.country;
        state.country = info.country;
        drawTrends();
        drawForecast();
        updateCalculator();
      }
    });

  // Draw legend
  drawMapLegend();
}

// ===== COLORFUL LEGEND =====
function drawMapLegend() {
  const legendContainer = document.getElementById("map-legend");
  legendContainer.innerHTML = "";

  const legendDiv = document.createElement("div");
  legendDiv.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;";

  const title = document.createElement("span");
  title.textContent = "Renewable Share:";
  title.style.cssText = "color:#94a3b8;font-size:0.72rem;font-weight:600;";
  legendDiv.appendChild(title);

  const levels = [
    { color: "#c0392b", label: "< 10%" },
    { color: "#e74c3c", label: "10–20%" },
    { color: "#e67e22", label: "20–30%" },
    { color: "#f39c12", label: "30–40%" },
    { color: "#f1c40f", label: "40–50%" },
    { color: "#2ecc71", label: "50–60%" },
    { color: "#27ae60", label: "60–75%" },
    { color: "#1a8a4a", label: "75%+" },
    { color: "#1e2d45", label: "No significant data" },
  ];

  levels.forEach(({ color, label }) => {
    const item = document.createElement("div");
    item.style.cssText = "display:flex;align-items:center;gap:4px;";

    const swatch = document.createElement("div");
    swatch.style.cssText = `
      width:16px;height:16px;
      background:${color};
      border-radius:3px;
      border:1px solid rgba(255,255,255,0.1);
    `;

    const lbl = document.createElement("span");
    lbl.textContent = label;
    lbl.style.cssText = "color:#94a3b8;font-size:0.68rem;white-space:nowrap;";

    item.appendChild(swatch);
    item.appendChild(lbl);
    legendDiv.appendChild(item);
  });

  legendContainer.appendChild(legendDiv);
}