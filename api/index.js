const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // BLOQUEO PARA NAVEGADOR: Si no es POST (que es como envía Salesforce el JWT), rechazamos.
    if (req.method !== 'POST') {
        return res.status(403).send('<h1>403 - Acceso Denegado</h1><p>Esta interfaz solo es accesible desde Salesforce Marketing Cloud.</p>');
    }

    const token = req.body.jwt;
    const secret = process.env.SFMC_JWT_SECRET;

    if (!token) {
        return res.status(401).send('Falta Token JWT.');
    }

    try {
        // Validamos el token con la llave maestra
        jwt.verify(token, secret);

        // Leemos el archivo que ahora está "escondido" en la raíz
        const htmlPath = path.join(process.cwd(), 'template.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // REEMPLAZO: Aquí es donde el token se imprime de verdad en el recuadro gris
        html = html.replace('', token);

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    } catch (err) {
        return res.status(401).send('Error de Seguridad: JWT Inválido.');
    }
};