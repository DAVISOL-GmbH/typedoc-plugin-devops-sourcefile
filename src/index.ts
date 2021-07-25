import { Application } from "typedoc";
import { DevopsSourcefileMapPlugin } from "./DevopsSourcefileMapPlugin";

export function load(app: Application) {
  app.options.addDeclaration({
    name: "devops-sourcefile-url-map",
    help: "[DevOps Source File Plugin] Pass an array of Azure DevOps URL templates. See https://github.com/shuebner20/typedoc-plugin-devops-sourcefile#advanced-mappings"
  });
  app.options.addDeclaration({
    name: "devops-sourcefile-url-prefix",
    help: "[DevOps Source File Plugin] Pass the Azure DevOps URL template. See https://github.com/shuebner20/typedoc-plugin-devops-sourcefile#simple-prefix"
  });

  app.converter.addComponent("devops-sourcefile", new DevopsSourcefileMapPlugin(app.converter));
};
