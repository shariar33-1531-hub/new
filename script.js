const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTOo-23u4-0MMRp5rup1gVnNnf8EAiK_wb6L07VxO3LLsbrHhGnki9sZxzJtrysy8c2KUS6Lr9ls0Iw/pub?output=csv";

const WHO_STANDARDS = {
  ph: { min: 6.5, max: 8.5 },
  tds: { max: 500 },
  turbidity: { max: 5 },
  temperature: { min: 15, max: 35 }
};

function checkStatus(param, value) {
  const std = WHO_STANDARDS[param];
  if (param === "ph" || param === "temperature") {
    return value >= std.min && value <= std.max ? "Safe" : "Unsafe";
  } else {
    return value <= std.max ? "Safe" : "Unsafe";
  }
}

async function loadData() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();
  const rows = text.trim().split("\n").slice(1).map(r => r.split(",").slice(0,5));
  const data = rows.map(row => ({
    time: row[0],
    ph: parseFloat(row[1]),
    tds: parseFloat(row[2]),
    turbidity: parseFloat(row[3]),
    temperature: parseFloat(row[4])
  })).filter(d => !isNaN(d.ph) && !isNaN(d.temperature));

  const latest = data[data.length - 1];
  const last10 = data.slice(-10);

  const avg = {
    ph: last10.reduce((a, v) => a + v.ph, 0) / last10.length,
    tds: last10.reduce((a, v) => a + v.tds, 0) / last10.length,
    turbidity: last10.reduce((a, v) => a + v.turbidity, 0) / last10.length,
    temperature: last10.reduce((a, v) => a + v.temperature, 0) / last10.length
  };

  const metricsDiv = document.getElementById("metrics");
  metricsDiv.innerHTML = "";
  const keys = ["ph", "tds", "turbidity", "temperature"];
  let anyUnsafe = false;

  keys.forEach(k => {
    const avgVal = avg[k].toFixed(2);
    const latestVal = latest[k].toFixed(2);
    const status = checkStatus(k, avg[k]);
    if (status === "Unsafe") anyUnsafe = true;
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `<h2>${k.toUpperCase()}</h2>
      <p><strong>Latest:</strong> ${latestVal}</p>
      <p><strong>Avg:</strong> ${avgVal}</p>
      <p>Status: <span class="status-${status.toLowerCase()}">${status}</span></p>`;
    metricsDiv.appendChild(card);
  });

  const alertBtn = document.getElementById("alertBtn");
  alertBtn.style.display = anyUnsafe ? "inline-block" : "none";

  alertBtn.onclick = () => {
    const unsafe = keys.filter(k => checkStatus(k, avg[k]) === "Unsafe");
    const msg = `Water Quality Alert:\n\nUnsafe parameters:\n${unsafe.map(k => `- ${k.toUpperCase()}: ${avg[k].toFixed(2)}`).join("\n")}`;
    window.location.href = \`mailto:admin@dphe.gov.bd?subject=Water Quality Alert&body=\${encodeURIComponent(msg)}\`;
  };

  drawChart("phChart", data, "ph", "pH", "blue");
  drawChart("tdsChart", data, "tds", "TDS (mg/L)", "green");
  drawChart("turbidityChart", data, "turbidity", "Turbidity (NTU)", "orange");
  drawChart("tempChart", data, "temperature", "Temperature (°C)", "red");
}

function drawChart(canvasId, data, key, label, color) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  if (window[key + "ChartInstance"]) window[key + "ChartInstance"].destroy();
  window[key + "ChartInstance"] = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.time),
      datasets: [{
        label,
        data: data.map(d => d[key]),
        borderColor: color,
        backgroundColor: color,
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Time" }},
        y: { title: { display: true, text: label }}
      }
    }
  });
}

loadData();
setInterval(loadData, 30000);
