const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_OWNER = "hongseongil985-lab";
const GITHUB_REPO = "apocalypse-seoul";
const BACKUP_FILE = "apocalypse_backup.json";

let data = {};
let backupSha = null;

function send(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(body));
}

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.github.com",
      path: path,
      method: method,
      headers: {
        "User-Agent": "apocalypse-seoul-server",
        "Authorization": "Bearer " + GITHUB_TOKEN,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      }
    }, res => {
      let result = "";

      res.on("data", chunk => {
        result += chunk;
      });

      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(result)
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: result
          });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function loadBackup() {
  if (!GITHUB_TOKEN) {
    return;
  }

  try {
    const result = await githubRequest(
      "GET",
      "/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/" + BACKUP_FILE
    );

    if (result.status !== 200) {
      return;
    }

    backupSha = result.data.sha;

    const decoded = Buffer.from(
      result.data.content.replace(/\n/g, ""),
      "base64"
    ).toString("utf8");

    const parsed = JSON.parse(decoded);

    if (parsed && typeof parsed === "object") {
      data = parsed;
    }
  } catch (e) {
  }
}

async function saveBackup() {
  if (!GITHUB_TOKEN) {
    return;
  }

  try {
    const content = Buffer.from(
      JSON.stringify(data, null, 2),
      "utf8"
    ).toString("base64");

    const body = {
      message: "자동 백업",
      content: content
    };

    if (backupSha) {
      body.sha = backupSha;
    }

    const result = await githubRequest(
      "PUT",
      "/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/" + BACKUP_FILE,
      body
    );

    if (result.status === 200 || result.status === 201) {
      backupSha = result.data.content.sha;
    }
  } catch (e) {
  }
}

async function startServer() {
  await loadBackup();

  const server = http.createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      return res.end();
    }

    if (req.method === "GET" && req.url === "/") {
      return send(res, 200, {
        status: "online",
        server: "apocalypse-seoul",
        backup: GITHUB_TOKEN ? "enabled" : "disabled"
      });
    }

    if (req.method === "GET" && req.url === "/api/data") {
      return send(res, 200, {
        success: true,
        data: data
      });
    }

    if (req.method === "POST" && req.url === "/api/data") {
      let body = "";

      req.on("data", chunk => {
        body += chunk;
      });

      req.on("end", async () => {
        try {
          const json = JSON.parse(body);

          data = json;

          await saveBackup();

          send(res, 200, {
            success: true,
            data: data,
            backedUp: !!GITHUB_TOKEN
          });
        } catch (e) {
          send(res, 400, {
            success: false,
            error: "잘못된 JSON"
          });
        }
      });

      return;
    }

    send(res, 404, {
      success: false,
      error: "Not Found"
    });
  });

  server.listen(PORT, () => {
    console.log("Server started on port " + PORT);
    console.log("Backup: " + (GITHUB_TOKEN ? "ON" : "OFF"));
  });
}

startServer();
