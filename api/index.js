const fs = require("fs");
const path = require("path");
const jwtLib = require("jsonwebtoken");

function safeJson(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

module.exports = async (req, res) => {
  const SFMC_JWT_SECRET = process.env.SFMC_JWT_SECRET || "";
  const jwtFromQuery = (req.query && (req.query.jwt || req.query.JWT)) || "";

  // Solo para debug visual (NO PRODUCCIÓN)
  const looksLikeJwt = typeof jwtFromQuery === "string" && jwtFromQuery.split(".").length === 3;

  let verifiedPayload = null;
  let verifyError = null;

  if (!SFMC_JWT_SECRET) {
    verifyError = "Falta SFMC_JWT_SECRET en Vercel.";
  } else if (!jwtFromQuery) {
    verifyError = "No llegó ?jwt=... en la URL. Revisa que config.json use edit.url=/api/index y useJwt:true.";
  } else if (!looksLikeJwt) {
    verifyError = "Llegó algo en ?jwt= pero NO tiene formato JWT (aaa.bbb.ccc).";
  } else {
    try {
      verifiedPayload = jwtLib.verify(jwtFromQuery, SFMC_JWT_SECRET);
    } catch (e) {
      verifyError = e.message;
    }
  }

  const htmlPath = path.join(process.cwd(), "template.html");
  let html = fs.readFileSync(htmlPath, "utf8");

  const resultado = `
    <div style="background:#000;color:#0f0;padding:15px;font-family:monospace;border:2px solid #fff;">
      <p><strong>SECRET (Vercel):</strong><br>
        <span style="color:#888;font-size:10px;">${SFMC_JWT_SECRET ? "(OK - cargado)" : "(VACÍO)"}</span>
      </p>

      <hr style="border-color:#555;">

      <p><strong>JWT por QUERY (?jwt=)</strong><br>
        <span style="font-size:10px;word-break:break-all;">${jwtFromQuery || "(vacío)"}</span>
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

      <p style="margin-top:10px;font-size:12px;color:#fff;"><strong>MÉTODO:</strong> ${req.method}</p>
    </div>
  `;

  html = html.replace("TOKEN_DE_SESION_AQUI", resultado);
  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
};