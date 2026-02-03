const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // PERMITIR CORS (Para que Salesforce pueda enviar el POST)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const secret = process.env.SFMC_JWT_SECRET || "SIN_SECRET";
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    let tokenCrudo = "NO LLEGÓ NADA (Sigue en GET)";
    
    if (req.method === 'POST') {
        // Leemos el cuerpo de la petición
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } 
            catch (e) { 
                const params = new URLSearchParams(body);
                body = Object.fromEntries(params.entries());
            }
        }
        if (body && body.jwt) {
            tokenCrudo = body.jwt;
        }
    }

    const resultado = `
        <div style="background: #000; color: #0f0; padding: 15px; font-family: monospace;">
            <p><strong>1. SECRET (Vercel):</strong> ${secret}</p>
            <p><strong>2. TOKEN (body.jwt):</strong> ${tokenCrudo}</p>
            <p><strong>METODO:</strong> ${req.method}</p>
        </div>
    `;

    html = html.replace('TOKEN_DE_SESION_AQUI', resultado);
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};