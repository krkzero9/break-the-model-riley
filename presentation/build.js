// Bundle the editable source files into one HTML file for offline sharing.
const fs = require("node:fs");
const path = require("node:path");
const read = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");
const inlineScript = (source) => source.replace(/<\/script/gi, "<\\/script");
fs.writeFileSync(path.join(__dirname, "replay-source.js"), "window.REPLAY_SOURCE = " + JSON.stringify({ script: fs.readFileSync(path.join(__dirname, "../reproduce.py"), "utf8"), cases: fs.readFileSync(path.join(__dirname, "../reproduce-cases.json"), "utf8") }) + ";\n", "utf8");
const scriptFiles = ["presentation-data.js", "database-data.js", "app.js", "database-app.js", "replay-source.js", "story-app.js"];
const bundledScript = name => {
  let source = read(name);
  if (name === "presentation-data.js") {
    source = source.replace(/"assets\/team\/[a-z-]+\.jpeg"/g, asset => JSON.stringify("data:image/jpeg;base64," + fs.readFileSync(path.join(__dirname, JSON.parse(asset))).toString("base64")));
  }
  return inlineScript(source);
};
let html = read("index.html")
  .replace('<link rel="stylesheet" href="styles.css">', `<style>${read("styles.css").replace(/^@charset[^\n]*\n/, "")}</style>`)
  .replace('<link rel="stylesheet" href="story.css">', `<style>${read("story.css")}</style>`)
  .replace(/^\s*<script defer src="(?:presentation-data|database-data|app|database-app|replay-source|story-app)\.js"><\/script>\r?\n/gm, "")
  .replace("</body>", `${scriptFiles.map(name => `<script>${bundledScript(name)}</script>`).join("\n")}\n</body>`);
const output = path.resolve(__dirname, "../presentation.html");
fs.writeFileSync(output, html, "utf8");
console.log(output);
