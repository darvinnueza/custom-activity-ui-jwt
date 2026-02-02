const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // 1. Permitir que Salesforce entre (siempre es POST)
    if (req.method !== 'POST') {
        return res.status(403).send('<h1>Acceso Denegado</h1><p>Entrada vía GET no permitida.</p>');
    }

    const secret = process.env.SFMC_JWT_SECRET;
    
    // 2. Extraer el JWT. Intentamos varias formas porque Salesforce es especial.
    let token = null;
    if (req.body && req.body.jwt) {
        token = req.body.jwt;
    } else if (typeof req.body === 'string') {
        // A veces viene como string y hay que parsearlo
        try {
            const parsed = JSON.parse(req.body);
            token = parsed.jwt;
        } catch(e) {
            // Si no es JSON, buscamos el parámetro jwt en el texto
            const params = new URLSearchParams(req.body);
            token = params.get('jwt');
        }
    }

    // 3. Si después de todo no hay token, mostramos qué recibió el servidor para arreglarlo
    if (!token) {
        return res.status(400).send(`<h1>Error de Body</h1><p>No se encontró el campo 'jwt'. Tipo de body: ${typeof req.body}</p>`);
    }

    try {
        // 4. Validar el JWT
        jwt.verify(token, secret);

        // 5. Cargar el HTML
        const htmlPath = path.join(process.cwd(), 'template.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Inyectar el token real
        html = html.replace('', token);

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (err) {
        // 6. Si el secreto está mal configurado en Vercel
        return res.status(401).send(`<h1>Error de Validación</h1><p>El JWT llegó pero el SECRET no coincide. Error: ${err.message}</p>`);
    }
};