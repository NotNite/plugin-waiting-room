/*
  Heya - if you're trying to reverse engineer the websocket, have fun! Please
  don't do anything malicious with it. Keep in mind this is running on my home
  server, so I ask of you to not connect a thousand clients to spam horses - I
  don't have the bandwidth for that :P

  If you find anything silly, I'll be active in the goat place Discord server
  (assuming I'm not busy with the patch) - NotNite#0001. I also usually have my
  email client open - hi@notnite.com.

  Thanks!
  - NotNite
*/

console.log("Psst... spawnHorse();");

const soundFile = document.createElement("audio");
soundFile.volume = 0.5;
soundFile.loop = true;
soundFile.muted = true;

document.querySelector("#volume-slider").addEventListener("input", (e) => {
  soundFile.volume = e.target.value / 100;
});

let playingDuckbeat = true;
let duckbeatVol = null;

let lastVideo = null;
const videos = [
  "fireplace.webm", // by tom
  "limsa.webm",
  "gridania.webm",
  "uldah.webm",
  "ishgard.webm",
  "kugane.webm",
  "crystarium.webm",
  "sharlayan.webm",
  "kugane2.webm", // by WildWolf
  "radz.webm", // by WildWolf
  "wolves_den.webm" // by WildWolf
];
const bag = [];

function spawnVideo() {
  if (bag.length <= 0) {
    bag.push(...videos);
    // shuffle bag
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  const videoFile = bag.pop();

  const video = document.createElement("video");
  video.className = "bg";
  video.src = "videos/" + videoFile;
  video.autoplay = true;
  video.muted = true;

  document.querySelector("main").appendChild(video);
  video.addEventListener("ended", () => {
    video.remove();
    spawnVideo();
  });
}

spawnVideo();

function playDuckbeat() {
  duckbeatVol = Math.floor(Math.random() * 10) + 1;

  soundFile.src = `duckbeats/vol${duckbeatVol}.mp3`;
  soundFile.play();
  soundFile.muted = false;

  document.querySelector(
    "#now-playing"
  ).textContent = `Now playing: lofi beats to quack to vol${duckbeatVol}`;
}

let soundInit = false;
document.addEventListener("click", () => {
  if (soundInit) return;

  playDuckbeat();
  document.querySelector("#sound-warning").remove();
  soundInit = true;
});

soundFile.addEventListener("ended", () => {
  if (soundInit && playingDuckbeat) playDuckbeat();
});

const peopleCount = document.querySelector("#people-count");
const timer = document.querySelector("#timer");

dayjs.extend(dayjs_plugin_relativeTime);
const maintenance = dayjs.unix(1673344800);

function updateTimer() {
  const time = maintenance.fromNow();
  const fullTime = maintenance.format("MMMM D, YYYY [at] h:mm A");

  const wentOrGo = maintenance.diff(dayjs()) > 0 ? "go" : "went";

  timer.innerHTML = `Plugins ${wentOrGo} offline <a style="text-decoration: underline;" title="${fullTime}">${time}</a>.`;
}

updateTimer();
setInterval(updateTimer, 1000);

function spawnHorse(isGolden) {
  const node = document.createElement("img");
  node.className = "emoji";
  node.style.width = "64px";
  node.style.height = "64px";

  node.style.left = `calc(${Math.random() * 100}% - 64px)`;
  node.src = isGolden ? "golden_horse.png" : "horse.png";

  document.querySelector(".horse-containment-zone").appendChild(node);

  setTimeout(() => {
    node.remove();
  }, 5000);
}

function doMessage(iconURL, title, desc) {
  const div = document.createElement("div");
  div.style = "display: flex; gap: 16px; align-items: center;";

  const image = document.createElement("img");
  image.src = iconURL;
  image.style.width = "128px";
  image.style.height = "128px";
  div.appendChild(image);

  const text = document.createElement("div");

  const header = document.createElement("h4");
  header.innerHTML = title;
  text.appendChild(header);

  const message = document.createElement("p");
  message.innerHTML = desc;
  text.appendChild(message);

  div.appendChild(text);

  Toastify({
    node: div,
    duration: 1000 * 60 * 60 * 24,
    close: false,
    gravity: "bottom",
    position: "right",
    style: {
      background: "black"
    }
  }).showToast();
}

function sanitize(text) {
  const temp = document.createElement("div");
  temp.textContent = text;
  return temp.innerHTML;
}

const wsUrl =
  location.hostname === "localhost"
    ? "ws://localhost:7310/"
    : "wss://plogon.com/ws";

let ws = null;

function handleWebsocket(event) {
  const data = JSON.parse(event.data);

  // this could be a switch case
  // but it's not
  if (data.type === "userUpdate") {
    const users = data.users - 1;

    if (users === 0) {
      peopleCount.textContent = "You're the only one here right now.";
    } else if (users === 1) {
      peopleCount.textContent = "There is 1 person waiting with you right now.";
    } else {
      peopleCount.textContent = `There are ${users} people waiting with you right now.`;
    }
  }

  if (data.type === "message") {
    doMessage(
      "https://avatars.githubusercontent.com/u/64093182?s=200&v=4",
      "Message from the developers",
      sanitize(data.message)
    );
  }

  if (data.type === "horse") {
    spawnHorse(false);
  }

  if (data.type === "goldenHorse") {
    spawnHorse(true);
  }

  if (data.type === "soundChange") {
    if (data.song === "duckbeat") {
      playingDuckbeat = true;
      if (soundInit) playDuckbeat();
    } else {
      playingDuckbeat = false;
      duckbeatVol = null;
      document.querySelector("#now-playing").textContent = "";

      soundFile.src = data.song;
      if (soundInit) soundFile.play();
    }
  }

  if (data.type === "commit") {
    // Prettier made this ugly as shit
    const repo = `<a href="https://github.com/${sanitize(
      data.repo
    )}" target="_blank" rel="noopener noreferrer">${sanitize(data.repo)}</a>`;
    const author = `<a href="https://github.com/${sanitize(
      data.author
    )}" target="_blank" rel="noopener noreferrer">${sanitize(data.author)}</a>`;
    doMessage(
      "https://namazu.photos/i/e7qiu2j6.png",
      `New commit to ${repo} by ${author}`,
      `${sanitize(data.message)}<br /><a href="${sanitize(
        data.url
      )}" target="_blank" rel="noopener noreferrer">View commit</a>`
    );
  }
}

function setupWebsocket() {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.close();
  }

  ws = new WebSocket(wsUrl);
  ws.addEventListener("message", handleWebsocket);
  ws.addEventListener("close", setupWebsocket);
}

setupWebsocket();

const horseButton = document.querySelector(".horse-button");
let horsed = false;
horseButton.addEventListener("click", () => {
  if (!horsed) {
    // There's serverside rate limiting here, but this saves us bandwidth
    // ...not that the horses are very bandwidth friendly
    ws.send(JSON.stringify({ type: "horse" }));
    horsed = true;
  }

  spawnHorse();
});

setInterval(() => {
  horsed = false;
}, 500);
