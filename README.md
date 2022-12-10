[typedoc](https://github.com/TypeStrong/typedoc) plugin to set source file URL links to a Git repository hosted in Azure DevOps.

This typedoc plugin is now compliant to *typedoc 0.23.x* and does no longer rely on [internally, removed typedoc structures](https://typedoc.org/guides/changelog/#v0.23.0-(2022-06-26)).

This plugin is a fork of [typedoc-plugin-sourcefile-url](https://github.com/gdelmas/typedoc-plugin-sourcefile-url) by [Gerard Delmàs](https://github.com/gdelmas). It's adopted to reference source files hosted in a Git repository at Azure DevOps from a typedoc-generated documentation.

typedoc prints a *Defined in* statement showing the source file and line for all definitions. For projects hosted on GitHub this statement will automatically link to the source file.

Alternatively, this plugin allows you to create links to source files located in Azure DevOps (GitHub) repos. It also adds a `&line=` anchor to the URL, linking to any specific line.

# Installation

    npm install --save-dev typedoc-plugin-devops-sourcefile
    
typedoc will automatically detect and load the plugin from `node_modules`.

# Usage

#### Simple Prefix

    typedoc --devops-sourcefile-url-prefix "https://dev.azure.com/[tenant]/[project]/_git/[repo]?path=%2F"

You need to set the following values in the path:

* **tenant** The tenant name of your organization in Azure DevOps, e.g. "mycompany"
* **project** The name of the team project containing the Git repository, e.g. "myproject"
* **repo** The name of the Git repository, e.g. "myproject-base"

For these example values you'll pass `https://dev.azure.com/mycompany/myproject/_git/myproject-base?path=%2F`.

**Hint** You can copy the URL from your browser's address bar when you navigate to the repository in Azure DevOps. Just add `?path=%2F` (or any deeper path in this repository) to the copied URL and you're done.

The `--devops-sourcefile-url-prefix` option will create URLs by prefixing the given parameter in front of each source file.

*Defined in* `src/testfile.ts:123` will link to `https://dev.azure.com/[tenant]/[project]/_git/[repo]?path=%2Fsrc%2Ftestfile.ts&line=123`.


#### Advanced Mappings

Sometimes more complex URL rules may be required. For example when grouping documentation of multiple repositories into one documentation page.

Advanced mappings are described in a JSON file.

    typedoc --devops-sourcefile-url-map your-sourcefile-map.json
    
The `your-sourcefile-map.json` structure is: 

  
    [
      {
        "pattern": "^modules/module-one",
        "replace": "https://dev.azure.com/mycompany/myproject/_git/module-one?path=%2F",
        "version": "GT1.0.0-rc"
      },     
      {
        "pattern": "^",
        "replace": "https://dev.azure.com/mycompany/myproject/_git/main-project?path=%2F",
        "version": "GBmaster"
      }
    ]

`pattern` is a regular expression (without enclosing slashes). Each *Defined in* statement is matched against the `pattern`. On match the `pattern` is replaced with the string from `replace` to create the URL.

There can be one or more mapping rules. For each *Defined in* only the first rule that matches is applied. In the above example the last rule would match all source files that did not start with `modules/module-one`. This compares to the *Simple Prefix* option.

You can optionally specify the target branch or tag (a.k.a. `version`). If you omit these value (or use the `--devops-sourcefile-url-prefix` option) no version parameter is appended to the URL and Azure DevOps will open the default branch (which is `master` by default). If you need to pass a target, the `&version=` parameter is added to the URL. The value needs to start with `GB` (Git branch) or `GT` (Git tag).

---

The options are mutually exclusive. It is not possible to use `--devops-sourcefile-url-prefix` and `--devops-sourcefile-url-map` at the same time.
