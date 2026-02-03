const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // 1. Secret de Vercel
    const elSecretDeVercel = process.env.SFMC_JWT_SECRET || "VARIABLE NO ENCONTRADA EN VERCEL";
    
    // Decodificación del Secret (Tratándolo como Base64 si lo fuera, o indicando su origen)
    let secretDecodificado = "";
    try {
        secretDecodificado = Buffer.from(elSecretDeVercel, 'base64').toString('utf-8');
    } catch (e) {
        secretDecodificado = "El Secret no es Base64 válido o es texto plano.";
    }

    // 2. Token de Salesforce
    let elTokenDeSalesforce = "NO LLEGÓ NADA (Sigue en modo GET)";
    let tokenDecodificado = "Esperando el POST de Salesforce...";
    
    if (req.method === 'POST') {
        let body = req.body;
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
                // Decodificamos la parte central (Payload) del JWT de Salesforce
                const base64Payload = elTokenDeSalesforce.split('.')[1];
                tokenDecodificado = Buffer.from(base64Payload, 'base64').toString('utf-8');
            } catch (e) {
                tokenDecodificado = "Error decodificando el Token: " + e.message;
            }
        }
    }

    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    const resultado = `
        <div style="background: #000; color: #0f0; padding: 15px; font-family: monospace; border: 2px solid #fff;">
            <p><strong>1. SECRET (Vercel):</strong><br>${elSecretDeVercel}</p>
            <p style="color: #fff; background: #222; padding: 5px;"><strong>DECODIFICACIÓN SECRET:</strong><br>${secretDecodificado}</p>
            
            <hr style="border-color: #555;">
            
            <p><strong>2. TOKEN (body.jwt):</strong><br>${elTokenDeSalesforce}</p>
            <p style="color: #000; background: #0f0; padding: 5px;"><strong>DECODIFICACIÓN TOKEN (JSON):</strong><br>${tokenDecodificado}</p>
            
            <p><strong>METODO:</strong> ${req.method}</p>
        </div>
    `;

    html = html.replace('TOKEN_DE_SESION_AQUI', resultado);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};