const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // 1. Salesforce envía el JWT en el body de un POST
    const token = req.body.jwt;
    const secret = process.env.SFMC_JWT_SECRET; 

    if (!token) {
        return res.status(401).send('<h1>Acceso Denegado</h1><p>Falta Token JWT.</p>');
    }

    try {
        // 2. Validamos que el token sea auténtico
        const decoded = jwt.verify(token, secret);

        // 3. Leemos tu index.html de la carpeta public
        const htmlPath = path.join(process.cwd(), 'public', 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // 4. Inyectamos el token en el placeholder que pusimos en el HTML
        const tokenHtml = `<div class="token-text">${token}</div>`;
        html = html.replace('', tokenHtml);

        res.status(200).send(html);
    } catch (err) {
        console.error("Error validando JWT:", err);
        return res.status(401).send('<h1>Error de Seguridad</h1><p>JWT no válido.</p>');
    }
};