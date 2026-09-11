/* =========================================================
   PLAYLIST DATA
   -----------------------------------------------------------
   Edit this array to make it yours. `duration` is in seconds.
   `src` can point to a real audio file (e.g. "songs/track1.mp3").
   Leave `src` as an empty string and the player will still work,
   using a gentle simulated progress bar instead of real audio —
   handy while you're picking songs before you have the files.
   ========================================================= */
const PLAYLIST = [
  { title: "Morning, Slow",        artist: "Mono Petals",     mood: "for the quiet mornings",        duration: 192, src: "" },
  { title: "Blue Hour",            artist: "Faraway Fields",  mood: "for driving with the windows down", duration: 241, src: "" },
  { title: "Still Here",           artist: "Paper Kites & Co.", mood: "for the long stretches of nothing", duration: 205, src: "" },
  { title: "Wildflower Season",    artist: "Halden",          mood: "for the good kind of restless",  duration: 178, src: "" },
  { title: "Second Half",          artist: "Mono Petals",     mood: "for after the hard days",       duration: 223, src: "" },
  { title: "Take the Long Way",    artist: "Coast & Compass", mood: "for when we're in no rush",     duration: 261, src: "" },
  { title: "Keep the Porch Light On", artist: "Faraway Fields", mood: "for coming home",              duration: 214, src: "" },
  { title: "Small Hours",          artist: "Halden",          mood: "for talking until 2am",         duration: 197, src: "" },
  { title: "Where the Flowers Are", artist: "Mono Petals",    mood: "for the whole road, honestly",  duration: 249, src: "" },
];

/* =========================================================
   ELEMENT REFERENCES
   ========================================================= */
const trackListEl   = document.getElementById("trackList");
const audioEl        = document.getElementById("audioEl");

const nowPlayingLabel = document.getElementById("nowPlayingLabel");
const playerTitle    = document.getElementById("playerTitle");
const playerArtist   = document.getElementById("playerArtist");
const timeCurrentEl  = document.getElementById("timeCurrent");
const timeTotalEl    = document.getElementById("timeTotal");
const progressBar    = document.getElementById("progressBar");
const volumeBar      = document.getElementById("volumeBar");
const playerNote     = document.getElementById("playerNote");

const shuffleBtn = document.getElementById("shuffleBtn");
const prevBtn    = document.getElementById("prevBtn");
const playBtn    = document.getElementById("playBtn");
const nextBtn    = document.getElementById("nextBtn");
const repeatBtn  = document.getElementById("repeatBtn");

const iconPlay  = playBtn.querySelector(".icon-play");
const iconPause = playBtn.querySelector(".icon-pause");

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

/* =========================================================
   STATE
   ========================================================= */
const state = {
  currentIndex: 0,
  isPlaying: false,
  shuffle: false,
  repeat: false,
  simulatedTime: 0,   // used when a track has no real audio src
};

let simTimer = null;

/* =========================================================
   HELPERS
   ========================================================= */
function formatTime(totalSeconds){
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function currentTrack(){
  return PLAYLIST[state.currentIndex];
}

/* =========================================================
   BUILD TRACK LIST
   ========================================================= */
function buildTrackList(){
  trackListEl.innerHTML = "";

  PLAYLIST.forEach((track, index) => {
    const li = document.createElement("li");
    li.className = "track";
    li.dataset.index = String(index);

    li.innerHTML = `
      <span class="track-num">${ROMAN[index] || index + 1}</span>
      <div class="track-main">
        <p class="track-title">${track.title}</p>
        <p class="track-meta">${track.artist}</p>
        <span class="track-mood">${track.mood}</span>
      </div>
      <div class="track-side">
        <span class="track-duration">${formatTime(track.duration)}</span>
        <button class="track-play" type="button" aria-label="Play ${track.title}">
          <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5Z" fill="currentColor"/></svg>
        </button>
      </div>
    `;

    li.addEventListener("click", () => selectTrack(index, { autoplay: true }));
    trackListEl.appendChild(li);
  });
}

function refreshTrackHighlight(){
  const items = trackListEl.querySelectorAll(".track");
  items.forEach((item) => {
    const isActive = Number(item.dataset.index) === state.currentIndex;
    item.classList.toggle("is-active", isActive);
  });
}

/* =========================================================
   LOADING & DISPLAYING A TRACK
   ========================================================= */
function selectTrack(index, { autoplay = false } = {}){
  stopSimulatedProgress();
  state.currentIndex = index;
  state.simulatedTime = 0;

  const track = currentTrack();

  nowPlayingLabel.textContent = `waypoint ${ROMAN[index] || index + 1} of ${ROMAN[PLAYLIST.length - 1] || PLAYLIST.length}`;
  playerTitle.textContent = track.title;
  playerArtist.textContent = track.artist;
  timeTotalEl.textContent = formatTime(track.duration);
  timeCurrentEl.textContent = "0:00";
  progressBar.value = 0;
  progressBar.max = track.duration;

  refreshTrackHighlight();

  if (track.src) {
    audioEl.src = track.src;
    audioEl.currentTime = 0;
  } else {
    audioEl.removeAttribute("src");
  }

  if (autoplay) {
    play();
  } else {
    pause();
  }
}

/* =========================================================
   PLAY / PAUSE
   ========================================================= */
function play(){
  state.isPlaying = true;
  playBtn.setAttribute("aria-pressed", "true");
  playBtn.setAttribute("aria-label", "Pause");
  iconPlay.hidden = true;
  iconPause.hidden = false;

  const track = currentTrack();

  if (track.src) {
    audioEl.play().catch(() => {
      playerNote.textContent = "Couldn't play that file — check the path in script.js.";
    });
  } else {
    playerNote.textContent = "";
    startSimulatedProgress();
  }
}

function pause(){
  state.isPlaying = false;
  playBtn.setAttribute("aria-pressed", "false");
  playBtn.setAttribute("aria-label", "Play");
  iconPlay.hidden = false;
  iconPause.hidden = true;

  if (currentTrack().src) {
    audioEl.pause();
  } else {
    stopSimulatedProgress();
  }
}

function togglePlay(){
  state.isPlaying ? pause() : play();
}

/* =========================================================
   SIMULATED PROGRESS (used when no audio src is set)
   ========================================================= */
function startSimulatedProgress(){
  stopSimulatedProgress();
  simTimer = setInterval(() => {
    state.simulatedTime += 0.25;
    const duration = currentTrack().duration;

    if (state.simulatedTime >= duration) {
      handleTrackEnd();
      return;
    }
    timeCurrentEl.textContent = formatTime(state.simulatedTime);
    progressBar.value = state.simulatedTime;
  }, 250);
}

function stopSimulatedProgress(){
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
  }
}

/* =========================================================
   NEXT / PREV / SHUFFLE / REPEAT
   ========================================================= */
function nextIndex(){
  if (state.shuffle && PLAYLIST.length > 1) {
    let next;
    do {
      next = Math.floor(Math.random() * PLAYLIST.length);
    } while (next === state.currentIndex);
    return next;
  }
  return (state.currentIndex + 1) % PLAYLIST.length;
}

function prevIndex(){
  return (state.currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
}

function handleTrackEnd(){
  if (state.repeat) {
    selectTrack(state.currentIndex, { autoplay: true });
  } else {
    selectTrack(nextIndex(), { autoplay: true });
  }
}

function goNext(){ selectTrack(nextIndex(), { autoplay: state.isPlaying }); }
function goPrev(){ selectTrack(prevIndex(), { autoplay: state.isPlaying }); }

function toggleShuffle(){
  state.shuffle = !state.shuffle;
  shuffleBtn.setAttribute("aria-pressed", String(state.shuffle));
  playerNote.textContent = state.shuffle ? "Shuffling the road ahead." : "";
}

function toggleRepeat(){
  state.repeat = !state.repeat;
  repeatBtn.setAttribute("aria-pressed", String(state.repeat));
  playerNote.textContent = state.repeat ? "Looping this waypoint." : "";
}

/* =========================================================
   PROGRESS + VOLUME INPUT HANDLERS
   ========================================================= */
progressBar.addEventListener("input", () => {
  const value = Number(progressBar.value);
  if (currentTrack().src) {
    audioEl.currentTime = value;
  } else {
    state.simulatedTime = value;
  }
  timeCurrentEl.textContent = formatTime(value);
});

volumeBar.addEventListener("input", () => {
  audioEl.volume = Number(volumeBar.value) / 100;
});

audioEl.addEventListener("timeupdate", () => {
  if (!currentTrack().src) return;
  timeCurrentEl.textContent = formatTime(audioEl.currentTime);
  progressBar.value = audioEl.currentTime;
});

audioEl.addEventListener("loadedmetadata", () => {
  if (audioEl.duration && Number.isFinite(audioEl.duration)) {
    progressBar.max = audioEl.duration;
    timeTotalEl.textContent = formatTime(audioEl.duration);
  }
});

audioEl.addEventListener("ended", handleTrackEnd);

/* =========================================================
   BUTTON BINDINGS
   ========================================================= */
playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", goNext);
prevBtn.addEventListener("click", goPrev);
shuffleBtn.addEventListener("click", toggleShuffle);
repeatBtn.addEventListener("click", toggleRepeat);

/* =========================================================
   FALLING PETALS (one quiet, ambient touch of motion)
   ========================================================= */
function spawnPetal(){
  const field = document.getElementById("petalField");
  const petal = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  petal.setAttribute("viewBox", "0 0 100 100");
  petal.classList.add("petal");

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "#himmel-flower");
  petal.appendChild(use);

  const startLeft = Math.random() * 100;
  const size = 10 + Math.random() * 14;
  const fallDuration = 9 + Math.random() * 7;
  const swayDuration = 3 + Math.random() * 2;
  const colors = ["#a9cbee", "#7fa8d6", "#c4dcf3"];

  petal.style.left = `${startLeft}vw`;
  petal.style.width = `${size}px`;
  petal.style.height = `${size}px`;
  petal.style.color = colors[Math.floor(Math.random() * colors.length)];
  petal.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;

  field.appendChild(petal);
  setTimeout(() => petal.remove(), fallDuration * 1000 + 200);
}

function startPetals(){
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  spawnPetal();
  setInterval(spawnPetal, 2600);
}

/* =========================================================
   INIT
   ========================================================= */
buildTrackList();
selectTrack(0, { autoplay: false });
audioEl.volume = Number(volumeBar.value) / 100;
startPetals();
