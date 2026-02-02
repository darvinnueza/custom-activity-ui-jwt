const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // CASO A: Salesforce envía datos (POST)
    if (req.method === 'POST') {
        let token = req.body ? req.body.jwt : null;

        // Si no viene en el body, lo buscamos como texto plano
        if (!token && typeof req.body === 'string') {
            const params = new URLSearchParams(req.body);
            token = params.get('jwt');
        }

        try {
            if (token) {
                jwt.verify(token, secret);
                html = html.replace('', token);
            }
        } catch (err) {
            // Si el token falla, igual mostramos el formulario pero avisamos
            html = html.replace('', 'Error de validación JWT');
        }
    } 
    // CASO B: Es un GET (navegador o validación inicial de SF)
    else {
        html = html.replace('', 'Esperando interacción de Salesforce...');
    }

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};