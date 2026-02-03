const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;
    
    if (req.method === 'POST') {
        const token = req.body.jwt;

        try {
            // AQUÍ VALIDAMOS Y DECODIFICAMOS
            const decoded = jwt.verify(token, secret);

            // Ahora verás en tu consola o pantalla los datos reales
            console.log("CONTENIDO DEL JWT:", decoded);

            return res.status(200).send(`
                <div style="color: #0f0; background: #000; padding: 20px;">
                    <h3>¡JWT VALIDADO!</h3>
                    <p><strong>ID de la Actividad:</strong> ${decoded.activityId || 'N/A'}</p>
                    <p><strong>Contexto:</strong> Journey Builder</p>
                    <pre>${JSON.stringify(decoded, null, 2)}</pre>
                </div>
            `);
        } catch (err) {
            return res.status(401).send("Error de firma: " + err.message);
        }
    }
    res.status(200).send("Esperando POST...");
};