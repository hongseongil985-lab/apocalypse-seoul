const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8"
  });

  res.end(JSON.stringify({
    status: "online",
    server: "apocalypse-seoul"
  }));
});

server.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
