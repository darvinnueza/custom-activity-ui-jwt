var connection = new Postmonger.Session();
var payload = {};

$(window).ready(onRender);

// Escuchamos la inicialización y la llegada de tokens
connection.on('initActivity', initialize);
connection.on('requestedTokens', onGetTokens);

function onRender() {
    // Avisamos que estamos listos y pedimos el Token inmediatamente
    connection.trigger('ready');
    connection.trigger('requestTokens');
}

function initialize(data) {
    console.log("Datos recibidos de Salesforce:", data);
    if (data) {
        payload = data;
    }

    var hasInArguments = Boolean(
        payload['arguments'] &&
        payload['arguments'].execute &&
        payload['arguments'].execute.inArguments &&
        payload['arguments'].execute.inArguments.length > 0
    );

    var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

    $.each(inArguments, function (index, inArgument) {
        $.each(inArgument, function (key, val) {
            if (key === 'message') {
                $('#message-input').val(val);
            }
        });
    });
}

// ESTA FUNCIÓN ES LA QUE ATRAPA EL TOKEN Y LO ENVÍA A TU INDEX.JS
function onGetTokens(tokens) {
    console.log("¡Token recibido desde Postmonger!", tokens);
    
    // Si el token existe, hacemos un POST manual a tu API para actualizar la vista
    if (tokens && tokens.token) {
        fetch('/api/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jwt: tokens.token })
        })
        .then(response => response.text())
        .then(html => {
            // Actualizamos el contenido de la página con la respuesta del servidor
            document.open();
            document.write(html);
            document.close();
        })
        .catch(err => console.error("Error enviando token al servidor:", err));
    }
}

connection.on('clickedNext', save);

function save() {
    var message = $('#message-input').val();

    payload['arguments'].execute.inArguments = [{
        "message": message,
        "contactKey": "{{Contact.Key}}"
    }];
    
    payload['metaData'].isConfigured = true;
    connection.trigger('updateActivity', payload);
}