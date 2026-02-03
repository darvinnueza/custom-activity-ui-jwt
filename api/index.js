const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    // El Secret que ya tienes en Vercel
    const secret = process.env.SFMC_JWT_SECRET;
    
    if (req.method === 'POST') {
        const token = req.body.jwt;

        try {
            // AQUÍ OCURRE LA MAGIA: 
            // Si el secret es incorrecto, esto lanza un error.
            const decoded = jwt.verify(token, secret);

            // Si llegamos aquí, el token es 100% real y seguro.
            console.log("DATOS DECRYPTADOS:", decoded);

            return res.status(200).json({
                status: "success",
                message: "JWT Validado correctamente",
                data: decoded // Aquí verás quién te llama desde Salesforce
            });
        } catch (err) {
            return res.status(401).json({
                status: "error",
                message: "Firma JWT inválida: " + err.message
            });
        }
    }
    
    res.status(200).send("Esperando POST con JWT...");
};