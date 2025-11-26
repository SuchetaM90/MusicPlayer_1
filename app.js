document.addEventListener("DOMContentLoaded", () => {
  const songListEl = document.getElementById("songList");
  const genreSelectEl = document.getElementById("genreSelect");
  const playSongEl = document.getElementById("playSong");
  const playlistSection = document.getElementById("createPlaylist");
  const toggleThemeSection = document.getElementById("toggleTheme");

  let songs = [];                // from songs.json
  let filteredSongs = [];         // current visible songs
  let currentIndex = null;        // index of currently playing song
  let playlists = {};             // { playlistName: [songObj, ...] }
  let activePlaylist = null;      // which playlist is being viewed
  
  // Load saved playlists
const savedPlaylists = localStorage.getItem("playlists");
if (savedPlaylists) {
  playlists = JSON.parse(savedPlaylists);
}

  // ===== Fetch songs.json =====
  fetch("songs.json")
    .then(res => res.json())
    .then(data => {
      songs = data.songs.flatMap(s => s.items.map(item => ({
        id: crypto.randomUUID(),
        name: item.name,
        artist: item.artist,
        img: item.image || "",
        genre: s.genre,
        source: item.url
      })));
      showSongs("all");
    });

  // ===== Show songs =====
  function showSongs(filter) {
    songListEl.innerHTML = "";
    filteredSongs = songs.filter(song => filter === "all" || song.genre === filter);

    if (!filteredSongs.length) {
      songListEl.innerHTML = "<li>No songs found</li>";
      return;
    }

    filteredSongs.forEach((song, idx) => {
      const li = document.createElement("li");
      li.textContent = `${song.name} - ${song.artist}`;
      li.style.fontFamily=`Arial`;
      li.style.fontWeight=`bold`;
      li.style.cursor = "pointer";

      li.addEventListener("click", () => {
        currentIndex = idx;
        renderCurrentSong();
      });

      songListEl.appendChild(li);
    });
  }

  // ===== Render current song =====
  function renderCurrentSong() {
    if (currentIndex === null || !filteredSongs[currentIndex]) return;
    const song = filteredSongs[currentIndex];

    const placeholderImg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='#ddd'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14'>No Image</text></svg>");

    playSongEl.innerHTML = `
      <div class="song-card">
        <img src="${song.img || placeholderImg}" alt="cover" style="width:150px;height:150px;object-fit:cover;border-radius:8px;">
        <h3>${song.name}</h3>
        <p><strong>Artist:</strong> ${song.artist}</p>
        <audio id="player" controls autoplay>
          <source src="${song.source}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
        <div>
          <button id="prevBtn">⏮ Prev</button>
          <button id="nextBtn">⏭ Next</button>
          <select id="playlistSelect">
            <option value="">Select playlist</option>
            ${Object.keys(playlists).map(pl => `<option value="${pl}">${pl}</option>`).join("")}
          </select>
          <button id="addBtn">＋ Add to Playlist</button>
        </div>
      </div>
    `;

    document.getElementById("prevBtn").addEventListener("click", playPrev);
    document.getElementById("nextBtn").addEventListener("click", playNext);
    document.getElementById("addBtn").addEventListener("click", () => {
      const pl = document.getElementById("playlistSelect").value;
      if (!pl) return alert("Select a playlist");
      addToPlaylist(song, pl);
    });
  }

  // ===== Next / Prev =====
  function playNext() {
    if (!filteredSongs.length) return;
    currentIndex = (currentIndex + 1) % filteredSongs.length;
    renderCurrentSong();
  }
  function playPrev() {
    if (!filteredSongs.length) return;
    currentIndex = (currentIndex - 1 + filteredSongs.length) % filteredSongs.length;
    renderCurrentSong();
  }
  
  //function befor renderplaylist()
  function savePlaylists() {
  localStorage.setItem("playlists", JSON.stringify(playlists));
  }


  // ===== Playlists =====
  function renderPlaylists() {
    playlistSection.innerHTML = `
      <h2>Playlists</h2>
      <input id="newPlaylist" placeholder="New playlist name">
      <button id="createBtn">Create</button>
      <ul id="playlistList"></ul>
      <div id="playlistSongs"></div>
    `;

    document.getElementById("createBtn").addEventListener("click", createPlaylist);

    const ul = document.getElementById("playlistList");
Object.keys(playlists).forEach(name => {

  const li = document.createElement("li");
  li.style.display = "flex";
  li.style.justifyContent = "space-between";
  li.style.alignItems = "center";
  li.style.marginBottom = "6px";

  // Playlist name label
  const nameSpan = document.createElement("span");
  nameSpan.textContent = name;
  nameSpan.style.cursor = "pointer";
  nameSpan.style.fontWeight = "bold";

  // Clicking playlist name loads its songs
  nameSpan.addEventListener("click", () => {
    activePlaylist = name;
    renderPlaylistSongs();
  });

  // DELETE BUTTON
  const delBtn = document.createElement("button");
  delBtn.textContent = "Delete";
  delBtn.style.marginLeft = "10px";
  delBtn.style.background = "#ff4d4d";
  delBtn.style.color = "white";
  delBtn.style.border = "none";
  delBtn.style.padding = "3px 8px";
  delBtn.style.cursor = "pointer";
  delBtn.style.borderRadius = "4px";

  // Delete playlist event
  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();  // prevent clicking the playlist itself
    if (!confirm(`Delete playlist "${name}"?`)) return;

    delete playlists[name];    // remove playlist from object
    savePlaylists();           // save to localStorage
    renderPlaylists();         // refresh UI
    document.getElementById("playlistSongs").innerHTML = ""; // clear songs view
  });

  li.appendChild(nameSpan);
  li.appendChild(delBtn);
  ul.appendChild(li);
});
  }

  function createPlaylist() {
    const name = document.getElementById("newPlaylist").value.trim();
    if (!name) return alert("Enter a name");
    if (playlists[name]) return alert("Already exists");
    playlists[name] = [];
    savePlaylists(); //added
    renderPlaylists();
  }

  function addToPlaylist(song, playlistName) {
    if (!playlists[playlistName]) return;
    if (playlists[playlistName].some(s => s.id === song.id)) return alert("Already in playlist");
    playlists[playlistName].push(song);
    savePlaylists();//added
    renderPlaylists();
  }

  function renderPlaylistSongs() {
  const container = document.getElementById("playlistSongs");
  container.innerHTML = `<h3>${activePlaylist}</h3>`;

  const ul = document.createElement("ul");

  playlists[activePlaylist].forEach((song, idx) => {
    const li = document.createElement("li");
    li.textContent = `${song.name} - ${song.artist}`;
    li.style.cursor = "pointer";
    li.style.fontWeight = "bold";

    // 🟢 CLICK TO PLAY FROM PLAYLIST
    li.addEventListener("click", () => {
      playSongFromPlaylist(activePlaylist, idx);
    });

    // remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      playlists[activePlaylist] =
        playlists[activePlaylist].filter(s => s.id !== song.id);
        savePlaylists();//added
      renderPlaylistSongs();
    });

    li.appendChild(removeBtn);
    ul.appendChild(li);
  });

  container.appendChild(ul);
}

function playSongFromPlaylist(playlistName, index) {
  const playlistSongs = playlists[playlistName];

  if (!playlistSongs || !playlistSongs[index]) return;

  // 🔄 Set filtered songs to THIS playlist only
  filteredSongs = playlistSongs;

  // 🔄 Update current index
  currentIndex = index;

  // 🎵 Render & play
  renderCurrentSong();
}


  // ===== Theme Toggle =====
  
  function toggleTheme() {
  const currentTheme = document.body.getAttribute("data-theme");
  if (currentTheme === "dark") {
    document.body.setAttribute("data-theme", "light");
  } else {
    document.body.setAttribute("data-theme", "dark");
  }
}

document.getElementById('themeBtn').addEventListener("click", toggleTheme);

  // ===== Events =====
  genreSelectEl.addEventListener("change", e => {
  showSongs(e.target.value);
  playSongEl.innerHTML = "";
});
renderPlaylists();
});
