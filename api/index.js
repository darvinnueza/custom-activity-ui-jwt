const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  const htmlPath = path.join(process.cwd(), "template.html");
  let html = fs.readFileSync(htmlPath, "utf8");

  const panel = `
    <div style="background:#000;color:#0f0;padding:15px;font-family:monospace;border:2px solid #fff;">
      <p><strong>CONFIG MODAL</strong></p>
      <p style="color:#fff;">
        Este endpoint es SOLO para renderizar el modal.<br>
        <span style="color:#ffaaaa;">
          SFMC NO envía JWT al configModal.url, por eso aquí no verás token.
        </span>
      </p>
      <hr style="border-color:#555;">
      <p style="color:#aaa;font-size:11px;">method:</p>
      <p style="color:#fff;margin-top:-8px;">${req.method}</p>
      <p style="color:#aaa;font-size:11px;">url:</p>
      <p style="color:#fff;margin-top:-8px;word-break:break-all;">${req.url || ""}</p>
      <p style="margin-top:12px;color:#0f0;">
        ✅ Para validar JWT revisa /api/execute, /api/save, /api/publish, /api/validate (Authorization: Bearer)
      </p>
    </div>
  `;

  html = html.replace("TOKEN_DE_SESION_AQUI", panel);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
};