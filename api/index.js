const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const elSecretDeVercel = process.env.SFMC_JWT_SECRET || "VARIABLE NO ENCONTRADA EN VERCEL";
    let elTokenDeSalesforce = "NO LLEGÓ NADA (Sigue en modo GET)";
    let decodificacionHtml = "";

    if (req.method === 'POST') {
        try {
            let body = req.body;

            // Aseguramos que el body sea un objeto
            if (typeof body === 'string') {
                try { body = JSON.parse(body); } catch (e) {
                    const params = new URLSearchParams(body);
                    body = Object.fromEntries(params.entries());
                }
            }

            // Buscamos el JWT (Salesforce a veces lo manda como 'jwt' o dentro de los argumentos)
            let jwtEncontrado = body.jwt || body.JWT || null;

            if (jwtEncontrado) {
                elTokenDeSalesforce = jwtEncontrado;
                const partes = jwtEncontrado.split('.');
                
                if (partes.length >= 2) {
                    const base64Payload = partes[1];
                    // Decodificamos de Base64 a texto y luego a JSON
                    const decodificadoRaw = Buffer.from(base64Payload, 'base64').toString('utf-8');
                    const jsonDecodificado = JSON.parse(decodificadoRaw);
                    
                    decodificacionHtml = `
                        <div style="margin-top: 15px; background: #111; color: #fff; padding: 10px; border: 1px dashed #0f0;">
                            <strong style="color: #0f0;">3. CONTENIDO REAL DEL TOKEN (JSON):</strong>
                            <pre style="font-size: 11px; white-space: pre-wrap; word-break: break-all; color: #fff; margin-top: 10px;">${JSON.stringify(jsonDecodificado, null, 2)}</pre>
                        </div>
                    `;
                }
            } else {
                elTokenDeSalesforce = "POST RECIBIDO PERO SIN CAMPO JWT. BODY: " + JSON.stringify(body);
            }
        } catch (err) {
            decodificacionHtml = `<p style="color: #ff4444;">❌ Error en proceso: ${err.message}</p>`;
        }
    }

    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    const resultado = `
        <div style="background: #000; color: #0f0; padding: 15px; font-family: monospace; border: 2px solid #fff;">
            <p><strong>1. SECRET (Vercel):</strong><br><span style="color: #888; font-size: 10px;">${elSecretDeVercel}</span></p>
            <hr style="border-color: #555;">
            <p><strong>2. TOKEN (body.jwt):</strong><br><span style="font-size: 10px; word-break: break-all;">${elTokenDeSalesforce}</span></p>
            
            ${decodificacionHtml}
            
            <p style="margin-top: 15px; font-size: 12px; color: #fff;"><strong>METODO:</strong> ${req.method}</p>
        </div>
    `;

    html = html.replace('TOKEN_DE_SESION_AQUI', resultado);
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};