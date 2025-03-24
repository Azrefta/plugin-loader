import fs from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginsDir = path.join(__dirname, "plugins");
const plugins = {};

if (!fs.existsSync(pluginsDir)) {
    console.log(chalk.red("[ERROR] Plugins folder not found!"));
    process.exit(1);
}

const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith(".js"));

for (const file of files) {
    const pluginPath = path.join(pluginsDir, file);
    try {
        const plugin = await import(`file://${pluginPath}`);
        const pluginName = path.basename(file, ".js");
        plugins[pluginName] = plugin.default || plugin;
        //console.log(chalk.green(`[LOADED] Plugin: ${pluginName}`));
    } catch (error) {
        console.log(chalk.red(`[ERROR] Failed to load plugin ${file}:`), error.message);
    }
}

export default plugins;