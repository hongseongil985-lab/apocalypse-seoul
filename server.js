const http = require("http");

const PORT = process.env.PORT || 3000;
let data = {};

function send(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    return send(res, 200, {
      status: "online",
      server: "apocalypse-seoul"
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

    req.on("end", () => {
      try {
        const json = JSON.parse(body);
        data = json;
        send(res, 200, {
          success: true,
          data: data
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
});
