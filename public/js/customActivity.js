/* global Postmonger */
var connection = new Postmonger.Session();
var payload = {};

$(window).ready(function () {
    connection.trigger("ready");
});

connection.on("initActivity", initialize);
connection.on("clickedNext", save);

function initialize(data) {
    payload = data || {};

    // Cargar valores guardados si existen
    var inArgs =
        payload.arguments &&
        payload.arguments.execute &&
        payload.arguments.execute.inArguments
        ? payload.arguments.execute.inArguments
        : [];

    inArgs.forEach(function (obj) {
        if (obj.message) $("#message-input").val(obj.message);
    });
}

function save() {
    var message = $("#message-input").val();

    payload.arguments = payload.arguments || {};
    payload.arguments.execute = payload.arguments.execute || {};
    payload.arguments.execute.inArguments = [
        {
            message: message,
            contactKey: "{{Contact.Key}}"
        }
    ];

    payload.metaData = payload.metaData || {};
    payload.metaData.isConfigured = true;

    connection.trigger("updateActivity", payload);
    connection.trigger("nextStep");
}