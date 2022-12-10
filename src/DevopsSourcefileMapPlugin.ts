import * as fs from "fs";
import * as path from "path";
import { ReflectionKind } from "typedoc";
import { ConverterComponent } from "typedoc/dist/lib/converter/components";
import { Context } from "typedoc/dist/lib/converter/context";
import { Converter } from "typedoc/dist/lib/converter/converter";
import { SourceReference } from "typedoc/dist/lib/models";
import { Component } from "typedoc/dist/lib/utils/component";
import { Options } from "typedoc/dist/lib/utils/options/options";

interface ISourcefileMapping {
    pattern: RegExp;
    replace: string;
    version?: string;
}

@Component({ name: "devops-sourcefile" })
export class DevopsSourcefileMapPlugin extends ConverterComponent {

    private mappings: ISourcefileMapping[] | undefined;

    public initialize(): void {
        this.listenTo(this.owner, Converter.EVENT_BEGIN, this.onBegin);
    }

    private onBegin(): void {
        // read options parameters
        const mapRelativePath = this.readStringOption("devops-sourcefile-url-map");
        const urlPrefix = this.readStringOption("devops-sourcefile-url-prefix");

        if (!mapRelativePath && !urlPrefix) {
            return;
        }

        try {
            if (mapRelativePath && urlPrefix) {
                throw new Error("use either --devops-sourcefile-url-prefix or --devops-sourcefile-url-map option");
            }

            if (mapRelativePath) {
                this.readMappingJson(mapRelativePath);
            } else if (urlPrefix) {
                this.mappings = [{
                    pattern: new RegExp("^"),
                    replace: urlPrefix,
                    version: undefined,
                }];
            }

            // register handler
            this.listenTo(this.owner, Converter.EVENT_RESOLVE_END, this.onEndResolve);
        } catch (e) {
            console.error("typedoc-plugin-sourcefile-url: " + e.message);
        }
    }

    private readStringOption(name: string): string | undefined {
        const options: Options = this.application.options;
        const value = options.getValue(name);

        if (typeof value !== "string") {
            return undefined;
        }

        return value;
    }

    private readMappingJson(mapRelativePath: string): void {
        // load json
        const mapAbsolutePath = path.join(process.cwd(), mapRelativePath);

        let json: any;
        try {
            json = JSON.parse(fs.readFileSync(mapAbsolutePath, "utf8"));
        } catch (e) {
            throw new Error("error reading --devops-sourcefile-url-map json file: " + e.message);
        }

        // validate json
        if (!(json instanceof Array)) {
            throw new Error("--devops-sourcefile-url-map json file has to have Array as root element");
        }

        this.mappings = [];

        // validate & process json
        for (const mappingJson of json) {
            if (mappingJson instanceof Object
                && mappingJson.hasOwnProperty("pattern") && typeof mappingJson.pattern === "string"
                && mappingJson.hasOwnProperty("replace") && typeof mappingJson.replace === "string") {

                let regExp: RegExp | null = null;
                let version: string | undefined = undefined;

                try {
                    regExp = new RegExp(mappingJson.pattern);
                } catch (e) {
                    throw new Error("error reading --devops-sourcefile-url-map: " + e.message);
                }

                if (mappingJson.hasOwnProperty("version") && typeof mappingJson.version === "string") {
                    version = mappingJson.version.trim();
                    if (typeof version === "string" && version.length > 0) {
                        if (version.indexOf("GB") !== 0 && version.indexOf("GT") !== 0) {
                            throw new Error("error reading --devops-sourcefile-url-map: The version value must start either with 'GB' (Git branch) or 'GT' (Git tag).");
                        }
                    } else {
                        version = undefined;
                    }
                }

                this.mappings.push({
                    pattern: regExp as RegExp,
                    replace: mappingJson.replace,
                    version: version
                });
            } else {
                throw new Error("--devops-sourcefile-url-map json file syntax has to be: [{\"pattern\": \"REGEX PATTERN STRING WITHOUT ENCLOSING SLASHES\", replace: \"STRING\", version?: \"STRING\"}, ETC.]");
            }
        }
    }

    private onEndResolve(context: Context): void {
        if (this.mappings === undefined) {
            throw new Error("assertion fail");
        }

        const project = context.project;

        // process mappings
        if (Array.isArray(project.sources)) {
            for (let index = 0; index < project.sources.length; index++) {
                const sourceFile = project.sources[index];
                for (const mapping of this.mappings) {
                    if (sourceFile.fileName.match(mapping.pattern)) {
                        sourceFile.url = sourceFile.fileName.replace(mapping.pattern, mapping.replace);
                        if (typeof mapping.version === "string") {
                            sourceFile.url += "&version=" + encodeURIComponent(mapping.version);
                        }
                        break;
                    }
                }                
            }
        }

        // add line anchors
        const reflections = project.getReflectionsByKind(ReflectionKind.All);
        for (const key in reflections) {
            const reflection = reflections[key];

            if (reflection.sources) {
                reflection.sources.forEach((source: SourceReference) => {
                    if (typeof source === "object" && typeof source?.url === "string" && source.url.length > 0) {
                        source.url = source.url + "&line=" + source.line;
                    }
                });
            }
        }
    }

}
