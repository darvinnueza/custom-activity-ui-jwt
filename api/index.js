const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    let token = null;

    if (req.method === 'POST') {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } 
            catch (e) { 
                const params = new URLSearchParams(body);
                body = Object.fromEntries(params.entries());
            }
        }
        token = body ? body.jwt : null;
    }

    if (token) {
        try {
            jwt.verify(token, secret);
            html = html.replace('TOKEN_DE_SESION_AQUI', token);
        } catch (err) {
            html = html.replace('TOKEN_DE_SESION_AQUI', "ERROR SECRET: " + err.message);
        }
    } else {
        // Este es el mensaje que ves ahora mismo
        html = html.replace('TOKEN_DE_SESION_AQUI', "Vercel recibió un GET (Navegador). No hay datos de Salesforce aún.");
    }

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};