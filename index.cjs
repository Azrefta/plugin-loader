const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const pluginsDir = path.join(__dirname, "plugins");
const plugins = {};

if (!fs.existsSync(pluginsDir)) {
    console.log(chalk.red("[ERROR] Plugins folder not found!"));
    process.exit(1);
}

fs.readdirSync(pluginsDir)
    .filter(file => file.endsWith(".js"))
    .forEach(file => {
        const pluginPath = path.join(pluginsDir, file);
        try {
            const plugin = require(pluginPath);
            const pluginName = path.basename(file, ".js");
            plugins[pluginName] = plugin;
            //console.log(chalk.green(`[LOADED] Plugin: ${pluginName}`));
        } catch (error) {
            console.log(chalk.red(`[ERROR] Failed to load plugin ${file}:`), error.message);
        }
    });

module.exports = plugins;