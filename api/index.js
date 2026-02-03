const fs = require("fs");
const path = require("path");
const jwtLib = require("jsonwebtoken");

function safeJson(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

module.exports = async (req, res) => {
  const SFMC_JWT_SECRET = process.env.SFMC_JWT_SECRET || "";

  // --- Captura TODO lo que llega ---
  const rawUrl = req.url || "";
  const q = (req.query || {});
  const queryKeys = Object.keys(q);

  // Busca jwt en varias formas
  const jwtFromQuery =
    q.jwt || q.JWT || q.token || q.Token || q.sfmcJwt || q.SFMC_JWT || "";

  // Authorization header
  const auth = (req.headers && (req.headers.authorization || req.headers.Authorization)) || "";
  const jwtFromAuth = auth.startsWith("Bearer ") ? auth.substring(7) : "";

  // Body (por si algún día llega POST)
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const jwtFromBody = body && (body.jwt || body.JWT) ? (body.jwt || body.JWT) : "";

  const jwtCandidate = jwtFromQuery || jwtFromAuth || jwtFromBody || "";

  let verifiedPayload = null;
  let verifyError = null;

  const looksLikeJwt = typeof jwtCandidate === "string" && jwtCandidate.split(".").length === 3;

  if (!SFMC_JWT_SECRET) {
    verifyError = "Falta SFMC_JWT_SECRET en Vercel.";
  } else if (!jwtCandidate) {
    verifyError = "No llegó JWT ni por query, ni Authorization: Bearer, ni body.";
  } else if (!looksLikeJwt) {
    verifyError = "Llegó un valor pero NO tiene formato JWT a.b.c (3 partes).";
  } else {
    try {
      verifiedPayload = jwtLib.verify(jwtCandidate, SFMC_JWT_SECRET);
    } catch (e) {
      verifyError = e.message;
    }
  }

  // Render HTML
  const htmlPath = path.join(process.cwd(), "template.html");
  let html = fs.readFileSync(htmlPath, "utf8");

  const panel = `
    <div style="background:#000;color:#0f0;padding:15px;font-family:monospace;border:2px solid #fff;">
      <p><strong>SECRET (Vercel)</strong><br>
        <span style="color:#aaa;font-size:11px;">SFMC_JWT_SECRET:</span>
        <span style="color:#0f0;"> ${SFMC_JWT_SECRET ? "(OK - cargado)" : "(NO)"}</span>
      </p>

      <hr style="border-color:#555;">

      <p><strong>REQUEST</strong><br>
        <span style="color:#aaa;font-size:11px;">method:</span> ${req.method}<br>
        <span style="color:#aaa;font-size:11px;">url:</span> <span style="font-size:11px;word-break:break-all;color:#fff;">${rawUrl}</span><br>
        <span style="color:#aaa;font-size:11px;">query keys:</span> <span style="color:#fff;">${queryKeys.length ? queryKeys.join(", ") : "(ninguna)"}</span>
      </p>

      <hr style="border-color:#555;">

      <p><strong>JWT detectado</strong><br>
        <span style="color:#aaa;font-size:11px;">query.jwt/JWT/token:</span><br>
        <span style="font-size:10px;word-break:break-all;">${jwtFromQuery || "(vacío)"}</span><br><br>

        <span style="color:#aaa;font-size:11px;">Authorization: Bearer</span><br>
        <span style="font-size:10px;word-break:break-all;">${jwtFromAuth || "(vacío)"}</span><br><br>

        <span style="color:#aaa;font-size:11px;">body.jwt</span><br>
        <span style="font-size:10px;word-break:break-all;">${jwtFromBody || "(vacío)"}</span>
      </p>

      <hr style="border-color:#555;">

      <p><strong>Resultado validación JWT</strong><br>
        ${
          verifiedPayload
            ? `<span style="color:#0f0;">✅ JWT VÁLIDO</span>
               <pre style="font-size:11px;white-space:pre-wrap;word-break:break-all;color:#fff;margin-top:10px;">${safeJson(verifiedPayload)}</pre>`
            : `<span style="color:#ff4444;">❌ NO AUTORIZADO:</span>
               <span style="color:#ffaaaa;">${verifyError || "sin detalle"}</span>`
        }
      </p>
    </div>
  `;

  html = html.replace("TOKEN_DE_SESION_AQUI", panel);
  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
};