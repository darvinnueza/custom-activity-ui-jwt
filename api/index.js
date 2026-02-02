const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    let token = null;

    // BUSQUEDA DEL TOKEN: Lo buscamos en todas las formas posibles que usa SFMC
    if (req.method === 'POST') {
        if (req.body && req.body.jwt) {
            token = req.body.jwt;
        } else if (typeof req.body === 'string') {
            // Si viene como texto, intentamos parsearlo
            try {
                const parsed = JSON.parse(req.body);
                token = parsed.jwt;
            } catch (e) {
                const params = new URLSearchParams(req.body);
                token = params.get('jwt');
            }
        }
    }

    // SI ENCONTRAMOS EL TOKEN, LO VALIDAMOS Y LO PONEMOS EN EL HTML
    if (token) {
        try {
            jwt.verify(token, secret);
            // Reemplazamos el texto de espera por el token real
            html = html.replace('Esperando interacción de Salesforce...', token);
        } catch (err) {
            html = html.replace('Esperando interacción de Salesforce...', 'Error de validación: El Secret no coincide.');
        }
    }

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};