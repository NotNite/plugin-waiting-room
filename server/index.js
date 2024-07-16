const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: 7310 });
const fs = require("fs");

const key = fs.readFileSync("key.txt", "utf8").trim();

let clicks = {};
const currentSong = "duckbeat";

let users = [];
function updateUsers() {
  users.forEach((user) => {
    user[0].send(JSON.stringify({ type: "userUpdate", users: users.length }));
  });
}

let hps = 0;
let lastHps = 0;

setInterval(() => {
  if (hps === lastHps) return;
  lastHps = hps;
  hps = 0;

  users.forEach((user) => {
    user[0].send(JSON.stringify({ type: "hps", hps: lastHps }));
  });
}, 1000);

wss.on("connection", (ws, req) => {
  const ip = req.headers["x-forwarded-for"];

  const connectionsWithThisIP = users.filter((user) => {
    return user[1] === ip;
  });

  // 2 clients per IP
  if (connectionsWithThisIP.length >= 2) {
    ws.close(1008, "you are why we can't have nice things");
    return;
  }

  users.push([ws, ip]);
  updateUsers();

  let usedHorse = false;
  let a = setInterval(() => {
    usedHorse = false;
  }, 500);

  ws.send(JSON.stringify({ type: "songChange", song: currentSong }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "admin") {
        if (data.key === key) {
          if (data.payload.type === "songChange") {
            currentSong = data.payload.song;
          }

          users.forEach((user) => {
            user[0].send(JSON.stringify(data.payload));
          });
        } else {
          console.log("Invalid key attempted: " + data.key);
        }
      }

      if (data.type === "horse") {
        if (usedHorse) return;

        const isGolden = Math.random() < 0.0001;

        users.forEach((user) => {
          if (user[0] === ws && !isGolden) return;
          user[0].send(
            JSON.stringify({ type: isGolden ? "goldenHorse" : "horse" })
          );
        });

        usedHorse = true;
        clicks[ip] = clicks[ip] ? clicks[ip] + 1 : 1;
        hps++;
      }
    } catch (e) {}
  });

  ws.on("close", () => {
    users = users.filter((user) => user[0] !== ws);
    updateUsers();
    clearInterval(a);
  });
});

setInterval(() => {
  fs.writeFileSync("./clicks.json", JSON.stringify(clicks));
}, 1000 * 60);
