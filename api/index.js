const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    let contenido = "";

    if (req.method === 'POST') {
        // Mostramos CUALQUIER COSA que llegue en el cuerpo de la petición
        contenido = "DATOS RECIBIDOS: " + JSON.stringify(req.body || "Body vacío");
    } else {
        contenido = "Vercel recibió un GET (Navegador). No hay datos de Salesforce aún.";
    }

    // Forzamos el reemplazo en tu HTML
    html = html.replace('TOKEN_DE_SESION_AQUI', contenido);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};