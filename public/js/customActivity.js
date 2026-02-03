var connection = new Postmonger.Session();
var payload = {};

$(window).ready(function () {
    connection.trigger('ready');
});

connection.on('initActivity', initialize);
connection.on('clickedNext', save);

function initialize(data) {
    if (data) {
        payload = data;
    }

    var hasInArguments =
        payload.arguments &&
        payload.arguments.execute &&
        payload.arguments.execute.inArguments &&
        payload.arguments.execute.inArguments.length > 0;

    if (hasInArguments) {
        var inArgs = payload.arguments.execute.inArguments[0];
        if (inArgs.message) {
            $('#message-input').val(inArgs.message);
        }
    }
}

function save() {
    payload.arguments.execute.inArguments = [{
        message: $('#message-input').val(),
        contactKey: '{{Contact.Key}}'
    }];

    payload.metaData.isConfigured = true;
    connection.trigger('updateActivity', payload);
}