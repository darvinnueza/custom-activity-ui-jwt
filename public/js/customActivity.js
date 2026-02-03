/* global Postmonger */
var connection = new Postmonger.Session();
var payload = {};

$(window).ready(function () {
    connection.trigger("ready");
});

connection.on("initActivity", function (data) {
    payload = data || {};

    // pintar valor guardado si existe
    var inArgs =
        payload.arguments &&
        payload.arguments.execute &&
        payload.arguments.execute.inArguments
        ? payload.arguments.execute.inArguments
        : [];

    inArgs.forEach(function (obj) {
        if (obj.message) $("#message-input").val(obj.message);
    });
});

connection.on("clickedNext", function () {
    var message = $("#message-input").val();

    payload.arguments = payload.arguments || {};
    payload.arguments.execute = payload.arguments.execute || {};
    payload.arguments.execute.inArguments = [{
        message: message,
        contactKey: "{{Contact.Key}}"
    }];

    payload.metaData = payload.metaData || {};
    payload.metaData.isConfigured = true;

    connection.trigger("updateActivity", payload);
    connection.trigger("next");
});

connection.on("clickedBack", function () {
    connection.trigger("prev");
});