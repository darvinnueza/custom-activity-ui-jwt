const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // 1. Obtenemos el JWT que Salesforce envía automáticamente por POST
    const token = req.body.jwt;
    const secret = process.env.SFMC_JWT_SECRET; // El valor que ya pusiste en Vercel

    if (!token) {
        return res.status(401).send('Acceso Denegado: No se encontró el token de seguridad.');
    }

    try {
        // 2. Validamos que el token sea auténtico con tu Secret
        jwt.verify(token, secret);

        // 3. Leemos el archivo index.html físico de tu carpeta public
        const htmlPath = path.join(process.cwd(), 'public', 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // 4. Inyectamos el JWT real dentro del HTML antes de enviarlo
        // Esto reemplaza el placeholder que pusimos en el paso anterior
        html = html.replace('', token);

        // 5. Enviamos el HTML final al modal de Salesforce
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);

    } catch (err) {
        console.error("Error de JWT:", err);
        return res.status(401).send('Error de Seguridad: El token no es válido.');
    }
};