const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const pluginsDir = path.join(__dirname, "plugins");
const plugins = {};

if (!fs.existsSync(pluginsDir)) {
  console.log(chalk.red("[ERROR] Plugins folder not found!"));
  process.exit(1);
}

const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith(".js"));

// Pastikan plugin .js di dalam folder "plugins" adalah CommonJS
for (const file of files) {
  const pluginPath = path.join(pluginsDir, file);
  try {
    // Memuat file CommonJS
    const plugin = require(pluginPath);
    const pluginName = path.basename(file, ".js");
    plugins[pluginName] = plugin.default || plugin;
  } catch (error) {
    console.log(chalk.red(`[ERROR] Failed to load plugin ${file}:`), error.message);
  }
}

module.exports = plugins;