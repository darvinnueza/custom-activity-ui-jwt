const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    let token = null;

    // Extraer token de Salesforce
    if (req.method === 'POST') {
        if (req.body && req.body.jwt) {
            token = req.body.jwt;
        } else if (typeof req.body === 'string') {
            const params = new URLSearchParams(req.body);
            token = params.get('jwt');
        }
    }

    // SI HAY TOKEN: Lo validamos y lo inyectamos
    if (token) {
        try {
            jwt.verify(token, secret);
            // Reemplazo directo sobre el ID que pusimos arriba
            html = html.replace('TOKEN_VA_AQUI', token);
        } catch (err) {
            html = html.replace('TOKEN_VA_AQUI', 'JWT_INVALIDO_REVISA_SECRET');
        }
    } else {
        // SI NO HAY TOKEN (Acceso externo):
        html = html.replace('TOKEN_VA_AQUI', 'Sin token (Acceso fuera de Salesforce)');
    }

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};