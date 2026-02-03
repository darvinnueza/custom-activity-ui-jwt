const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

function maskSecret(s) {
  if (!s) return "VACIO";
  if (process.env.SHOW_SECRET === "1") return s; // solo si tú lo habilitas
  if (s.length <= 10) return "**********";
  return s.slice(0, 6) + "..." + s.slice(-4);
}

function safeJson(obj) {
  try { return JSON.stringify(obj, null, 2); } catch (e) { return String(obj); }
}

module.exports = async (req, res) => {
  const secret = process.env.SFMC_JWT_SECRET || "";
  const secretShown = maskSecret(secret);

  // --- Body robusto ---
  let body = req.body;
  try {
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        const params = new URLSearchParams(body);
        body = Object.fromEntries(params.entries());
      }
    }
  } catch (e) {
    body = {};
  }

  // --- Token candidates (NO asumo nada, muestro TODO) ---
  const authHeader = req.headers?.authorization || "";
  const bearer = authHeader.match(/^Bearer\s+(.+)$/i)?.[1] || "";

  const tokenCandidates = {
    "body.jwt": body?.jwt || "",
    "body.JWT": body?.JWT || "",
    "body.token": body?.token || "",
    "body.fuel2token": body?.fuel2token || "",
    "Authorization(Bearer)": bearer || "",
    "Authorization(raw)": authHeader || ""
  };

  // Elegimos el primero no vacío
  const tokenRecibido =
    tokenCandidates["body.jwt"] ||
    tokenCandidates["body.JWT"] ||
    tokenCandidates["Authorization(Bearer)"] ||
    tokenCandidates["body.token"] ||
    "";

  // Check formato JWT
  const partes = (tokenRecibido || "").split(".");
  const pareceJwt = partes.length === 3;

  let estado = `NO JWT (formato)`;
  let verificado = false;
  let payload = null;
  let errorVerify = "";

  if (pareceJwt) {
    estado = "JWT detectado (formato OK) → verificando firma...";
    try {
      if (!secret) throw new Error("SFMC_JWT_SECRET vacío en Vercel");
      payload = jwt.verify(tokenRecibido, secret);
      verificado = true;
      estado = "JWT VALIDADO ✅";
    } catch (e) {
      errorVerify = e.message;
      estado = "JWT pero FIRMA INVÁLIDA ❌";
    }
  }

  // --- Render HTML usando tu template.html ---
  const htmlPath = path.join(process.cwd(), "template.html");
  let html = fs.readFileSync(htmlPath, "utf8");

  const resultado = `
    <div style="background:#000;color:#0f0;padding:15px;font-family:monospace;border:2px solid #fff;">
      <p><strong>1. SECRET (Vercel):</strong><br>
        <span style="color:#888;font-size:10px;">${secretShown}</span>
      </p>

      <hr style="border-color:#555;">

      <p><strong>2. ESTADO:</strong><br>
        <span style="color:${verificado ? "#0f0" : "#ff4444"};font-size:12px;">${estado}</span>
      </p>

      ${errorVerify ? `
        <p><strong>Error verify:</strong><br>
          <span style="color:#ff4444;font-size:10px;">${errorVerify}</span>
        </p>` : ""}

      <hr style="border-color:#555;">

      <p><strong>3. TOKEN ELEGIDO:</strong><br>
        <span style="font-size:10px;word-break:break-all;color:#9f9;">${tokenRecibido || "VACIO"}</span>
      </p>

      <p><strong>4. CANDIDATOS (lo que llegó):</strong></p>
      <pre style="font-size:10px;white-space:pre-wrap;word-break:break-all;color:#fff;background:#111;padding:10px;border:1px dashed #0f0;">${safeJson(tokenCandidates)}</pre>

      <p><strong>5. BODY COMPLETO:</strong></p>
      <pre style="font-size:10px;white-space:pre-wrap;word-break:break-all;color:#fff;background:#111;padding:10px;border:1px dashed #0f0;">${safeJson(body)}</pre>

      ${payload ? `
        <p><strong>6. PAYLOAD (VERIFICADO):</strong></p>
        <pre style="font-size:10px;white-space:pre-wrap;word-break:break-all;color:#fff;background:#111;padding:10px;border:1px dashed #0f0;">${safeJson(payload)}</pre>
      ` : ""}

      <p style="margin-top:15px;font-size:12px;color:#fff;"><strong>MÉTODO:</strong> ${req.method}</p>
    </div>
  `;

  html = html.replace("TOKEN_DE_SESION_AQUI", resultado);
  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
};