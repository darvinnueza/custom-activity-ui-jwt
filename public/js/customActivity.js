var connection = new Postmonger.Session();
var payload = {};
var lastStep = 'step1';

$(window).ready(onRender);

// 1. Inicialización: Salesforce nos envía los datos de la actividad
connection.on('initActivity', initialize);

function onRender() {
    // 1. Avisamos que estamos listos
    connection.trigger('ready');
    
    // 2. Pedimos explícitamente los tokens (esto fuerza a SFMC a responder)
    connection.trigger('requestTokens');
    connection.trigger('requestEndpoints');
}

function initialize(data) {
    console.log("Datos recibidos de Salesforce:", data);
    if (data) {
        payload = data;
    }

    // Si ya había un mensaje guardado anteriormente, lo ponemos en el input
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

// 2. Guardado: Cuando el usuario hace clic en "Listo" (Done) en Salesforce
connection.on('clickedNext', save);

function save() {
    var message = $('#message-input').val();

    // Configuramos los argumentos que recibirá el VoiceBot en la ejecución
    payload['arguments'].execute.inArguments = [{
        "message": message,
        "contactKey": "{{Contact.Key}}" // Referencia dinámica de Salesforce
    }];
    
    payload['metaData'].isConfigured = true;

    console.log("Guardando payload:", payload);
    
    // Le decimos a Salesforce que ya terminamos y pase el payload final
    connection.trigger('updateActivity', payload);
}