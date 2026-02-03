var connection = new Postmonger.Session();
var payload = {};

$(window).ready(onRender);

// 1. Escuchamos los eventos de Salesforce
connection.on('initActivity', initialize);
connection.on('requestedTokens', onGetTokens);

function onRender() {
    // Pedimos el Token a Salesforce
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

// 2. Aquí atrapamos el Token y matamos el círculo de carga
function onGetTokens(tokens) {
    console.log("¡Token recibido!", tokens);
    
    if (tokens && tokens.token) {
        fetch('/api/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jwt: tokens.token })
        })
        .then(response => response.text())
        .then(html => {
            // CAMBIO CLAVE: Reemplazamos el contenido sin bloquear Salesforce
            document.body.innerHTML = html;
        })
        .catch(err => console.error("Error enviando token:", err));
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