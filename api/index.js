const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // 1. Obtenemos el Secret de Vercel
    const elSecretDeVercel = process.env.SFMC_JWT_SECRET || "VARIABLE NO ENCONTRADA EN VERCEL";
    
    // 2. Intentamos obtener el JWT del body (si es que Salesforce lo mandó)
    let elTokenDeSalesforce = "NO LLEGÓ NADA (Sigue en modo GET)";
    
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
        } else {
            elTokenDeSalesforce = "BODY RECIBIDO PERO SIN CAMPO JWT";
        }
    }

    // 3. Cargamos el HTML y reemplazamos
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Construimos el bloque de texto simple para imprimir
    const resultado = `
        <div style="background: #000; color: #0f0; padding: 15px; font-family: monospace; border: 2px solid #fff;">
            <p><strong>1. SECRET (Vercel):</strong><br>${elSecretDeVercel}</p>
            <hr style="border-color: #555;">
            <p><strong>2. TOKEN (body.jwt):</strong><br>${elTokenDeSalesforce}</p>
            <p><strong>METODO:</strong> ${req.method}</p>
        </div>
    `;

    html = html.replace('TOKEN_DE_SESION_AQUI', resultado);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};