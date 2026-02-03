const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // 1. Obtenemos el Secret de Vercel
    const elSecretDeVercel = process.env.SFMC_JWT_SECRET || "VARIABLE NO ENCONTRADA EN VERCEL";
    
    // 2. Variables para el Token
    let elTokenDeSalesforce = "NO LLEGÓ NADA (Sigue en modo GET)";
    let decodificacionHtml = "";
    
    // 3. Si es POST, procesamos el Token
    if (req.method === 'POST') {
        let body = req.body;
        
        // Manejo de body por si viene como string o formulario
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } 
            catch (e) { 
                const params = new URLSearchParams(body);
                body = Object.fromEntries(params.entries());
            }
        }

        if (body && body.jwt) {
            elTokenDeSalesforce = body.jwt;
            try {
                // DECODIFICAMOS EL TOKEN (La parte central del JWT)
                const base64Payload = elTokenDeSalesforce.split('.')[1];
                const decodificadoRaw = Buffer.from(base64Payload, 'base64').toString('utf-8');
                const jsonDecodificado = JSON.parse(decodificadoRaw);
                
                // Creamos el bloque visual para la decodificación
                decodificacionHtml = `
                    <div style="margin-top: 15px; background: #111; color: #fff; padding: 10px; border: 1px dashed #0f0;">
                        <strong style="color: #0f0;">3. DECODIFICACIÓN DEL TOKEN (JSON):</strong>
                        <pre style="font-size: 11px; white-space: pre-wrap; word-break: break-all;">${JSON.stringify(jsonDecodificado, null, 2)}</pre>
                    </div>
                `;
            } catch (e) {
                decodificacionHtml = `<p style="color: red;">Error decodificando: ${e.message}</p>`;
            }
        } else {
            elTokenDeSalesforce = "BODY RECIBIDO PERO SIN CAMPO JWT";
        }
    }

    // 4. Cargamos el HTML base (template.html)
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // 5. Construimos el bloque de resultado final
    const resultado = `
        <div style="background: #000; color: #0f0; padding: 15px; font-family: monospace; border: 2px solid #fff;">
            <p><strong>1. SECRET (Vercel):</strong><br><span style="color: #888;">${elSecretDeVercel}</span></p>
            <hr style="border-color: #555;">
            <p><strong>2. TOKEN (body.jwt):</strong><br><span style="font-size: 10px; word-break: break-all;">${elTokenDeSalesforce}</span></p>
            
            ${decodificacionHtml}
            
            <p style="margin-top: 15px; font-size: 12px; color: #fff;"><strong>METODO:</strong> ${req.method}</p>
        </div>
    `;

    // 6. Reemplazamos en el template y enviamos
    html = html.replace('TOKEN_DE_SESION_AQUI', resultado);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};