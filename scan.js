/* =====================================================
   Bharat.io – QR Scan Engine
   File: scan.js
   Purpose:
   - Read QR ID from URL
   - Check if QR is registered
   - Show Call / Email / Work info
===================================================== */

/* ======================
   CONFIG
====================== */

// 👇 APNA CSV LINK YAHA PASTE KARO
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?output=csv";

/* ======================
   HELPERS
====================== */

// URL se query param nikaalna
function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// CSV text → rows
function parseCSV(text) {
  return text
    .trim()
    .split("\n")
    .map(row =>
      row
        .split(",")
        .map(cell => cell.replace(/^"|"$/g, "").trim())
    );
}

// Basic XSS safety
function safe(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ======================
   MAIN
====================== */

const resultBox = document.getElementById("result");
const qrId = getParam("id");

// 1️⃣ QR ID missing
if (!qrId) {
  resultBox.innerHTML = `
    <h2>Invalid QR</h2>
    <p>This QR code link is incomplete.</p>
  `;
} else {
  // 2️⃣ Sheet fetch
  fetch(SHEET_CSV_URL)
    .then(res => res.text())
    .then(csv => {
      const rows = parseCSV(csv);
      const data = rows.slice(1); // header hata diya

      // QR match
      const row = data.find(r => r[0] === qrId);

      // 3️⃣ QR not registered
      if (!row) {
        resultBox.innerHTML = `
          <h2>QR Not Registered</h2>
          <p>
            This QR sticker is not yet connected to a vehicle.
            Please ask the owner to register it.
          </p>

          <a href="index.html#contact" class="btn-primary">
            Contact Support
          </a>
        `;
        return;
      }

      // 4️⃣ Data extract
      const phone = safe(row[2]);
      const email = safe(row[3]);
      const profession = safe(row[4]);
      const work = safe(row[5]);
      const consent = (row[6] || "").toUpperCase();

      // 5️⃣ Consent check
      if (consent !== "YES") {
        resultBox.innerHTML = `
          <h2>Access Disabled</h2>
          <p>
            The vehicle owner has not enabled public contact
            for this QR code.
          </p>
        `;
        return;
      }

      // 6️⃣ Show owner info
      resultBox.innerHTML = `
        ${profession ? `<p><strong>Profession:</strong> ${profession}</p>` : ""}
        ${work ? `<p>${work}</p>` : ""}

        ${phone ? `
          <a href="tel:${phone}" class="btn-primary">
            📞 Call Vehicle Owner
          </a>
        ` : ""}

        ${email ? `
          <a href="mailto:${email}" class="btn-primary" style="margin-top:12px;">
            ✉️ Email Owner
          </a>
        ` : ""}
      `;
    })
    .catch(() => {
      resultBox.innerHTML = `
        <h2>Error</h2>
        <p>
          Unable to load vehicle details right now.
          Please try again later.
        </p>
      `;
    });
}
