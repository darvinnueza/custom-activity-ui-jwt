const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // PRUEBA DE FUEGO: Vamos a ignorar la validación un segundo para ver el HTML
    try {
        const htmlPath = path.join(process.cwd(), 'template.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Si hay un token, lo mostramos; si no, ponemos un aviso
        const token = req.body ? req.body.jwt : "No llegó token por POST";
        html = html.replace('', token);

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
    } catch (err) {
        return res.status(500).send("Error interno: " + err.message);
    }
};