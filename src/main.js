var plugin = require("./DevopsSourcefileMapPlugin");

module.exports = function (PluginHost) {
  var app = PluginHost.owner;

  app.options.addDeclaration({ name: "devops-sourcefile-url-map" });
  app.options.addDeclaration({ name: "devops-sourcefile-url-prefix" });

  app.converter.addComponent("devops-sourcefile", plugin.DevopsSourcefileMapPlugin);
};