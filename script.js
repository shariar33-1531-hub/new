const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTOo-23u4-0MMRp5rup1gVnNnf8EAiK_wb6L07VxO3LLsbrHhGnki9sZxzJtrysy8c2KUS6Lr9ls0Iw/pub?output=csv";

async function loadData() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();
  const rows = text.trim().split("\n").slice(1).map(row => row.split(","));
  const headers = ["Timestamp", "pH", "TDS", "Turbidity", "Temp"];
  const data = rows.map(row => {
    return {
      time: row[0],
      ph: parseFloat(row[1]),
      tds: parseFloat(row[2]),
      turbidity: parseFloat(row[3]),
      temp: parseFloat(row[4]),
    };
  });

  const latest = data[data.length - 1];
  const last10 = data.slice(-10);

  document.getElementById("ph").innerText = `pH: ${latest.ph.toFixed(2)}`;
  document.getElementById("tds").innerText = `TDS: ${latest.tds.toFixed(2)} mg/L`;
  document.getElementById("turbidity").innerText = `Turbidity: ${latest.turbidity.toFixed(2)} NTU`;
  document.getElementById("temperature").innerText = `Temp: ${latest.temp.toFixed(2)} °C`;

  const ctx = document.getElementById("chart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.time),
      datasets: [
        {
          label: "pH",
          data: data.map(d => d.ph),
          borderColor: "blue",
          fill: false
        },
        {
          label: "TDS (mg/L)",
          data: data.map(d => d.tds),
          borderColor: "green",
          fill: false
        },
        {
          label: "Turbidity (NTU)",
          data: data.map(d => d.turbidity),
          borderColor: "orange",
          fill: false
        },
        {
          label: "Temperature (°C)",
          data: data.map(d => d.temp),
          borderColor: "red",
          fill: false
        }
      ]
    }
  });
}

loadData();
