var connection = new Postmonger.Session();
var payload = {};

$(window).ready(onRender);

connection.on('initActivity', initialize);
connection.on('requestedTokens', onGetTokens);

function onRender() {
    connection.trigger('ready');
    connection.trigger('requestTokens');
}

function initialize(data) {
    if (data) { payload = data; }
    var inArguments = (payload.arguments && payload.arguments.execute && payload.arguments.execute.inArguments) 
        ? payload.arguments.execute.inArguments : [];

    $.each(inArguments, function (index, inArgument) {
        $.each(inArgument, function (key, val) {
            if (key === 'message') { $('#message-input').val(val); }
        });
    });
}

function onGetTokens(tokens) {
    if (tokens && tokens.token) {
        // Hacemos el POST al servidor
        fetch('/api/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jwt: tokens.token })
        })
        .then(res => res.text())
        .then(html => {
            // ESTO ES LO QUE ELIMINA EL CÍRCULO DE CARGA
            document.body.innerHTML = html;
        })
        .catch(err => {
            console.error("Error:", err);
            document.body.innerHTML = "<p style='color:red;'>Error de red: " + err.message + "</p>";
        });
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