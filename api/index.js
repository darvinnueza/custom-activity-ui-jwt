const fs = require("fs");
const path = require("path");
const jwtLib = require("jsonwebtoken");

function safeJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}

module.exports = async (req, res) => {
  // IMPORTANTE: el edit.url debe llamarse por GET
  if (req.method !== "GET") {
    res.setHeader("Content-Type", "text/plain");
    return res
      .status(405)
      .send("SOLO GET: /api/index debe cargarse con ?jwt=... desde SFMC.");
  }

  const SFMC_JWT_SECRET = process.env.SFMC_JWT_SECRET || "";

  // JWT REAL: viene por query cuando useJwt:true en edit
  const jwtFromQuery = req.query && (req.query.jwt || req.query.JWT) ? (req.query.jwt || req.query.JWT) : "";

  // Cargamos tu template SIN cambiar tu diseño
  const htmlPath = path.join(process.cwd(), "template.html");
  let html = fs.readFileSync(htmlPath, "utf8");

  let verifiedPayload = null;
  let verifyError = null;

  const looksLikeJwt =
    typeof jwtFromQuery === "string" && jwtFromQuery.split(".").length === 3;

  if (!SFMC_JWT_SECRET) {
    verifyError = "Falta SFMC_JWT_SECRET en Vercel (Environment Variables).";
  } else if (!jwtFromQuery) {
    verifyError =
      "No llegó ?jwt=... en la URL. Eso significa que SFMC NO está pasando el JWT a tu edit.url.";
  } else if (!looksLikeJwt) {
    verifyError =
      "Llegó ?jwt= pero NO tiene formato JWT a.b.c (3 partes).";
  } else {
    try {
      verifiedPayload = jwtLib.verify(jwtFromQuery, SFMC_JWT_SECRET);
    } catch (e) {
      verifyError = e.message;
    }
  }

  const resultado = `
    <div style="background:#000;color:#0f0;padding:15px;font-family:monospace;border:2px solid #fff;">
      <p><strong>SECRET (Vercel):</strong><br>
        <span style="color:#aaa;font-size:11px;">${
          SFMC_JWT_SECRET ? "(OK - cargado)" : "(VACÍO)"
        }</span>
      </p>

      <hr style="border-color:#555;">

      <p><strong>JWT por QUERY (?jwt=):</strong><br>
        <span style="font-size:10px;word-break:break-all;">${
          jwtFromQuery ? jwtFromQuery : "(vacío)"
        }</span>
      </p>

      <hr style="border-color:#555;">

      <p><strong>Resultado validación JWT</strong><br>
        ${
          verifiedPayload
            ? `<span style="color:#0f0;">✅ JWT VÁLIDO</span>
               <div style="margin-top:10px;color:#fff;">
                 <strong style="color:#0f0;">PAYLOAD:</strong>
                 <pre style="font-size:11px;white-space:pre-wrap;word-break:break-all;color:#fff;margin-top:10px;">${safeJson(
                   verifiedPayload
                 )}</pre>
               </div>`
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