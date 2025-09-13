console.log("let us try some javascript");


let currentsong = new Audio();
let songs = [];
let currfolder;


const play = document.getElementById("play");
const previous = document.getElementById("previous");
const next = document.getElementById("next");


function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

//  this is for Fetching songs from a folder
async function getsongs(folder) {
    currfolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    songs = [];

    for (let i = 0; i < as.length; i++) {
        let element = as[i];
        if (element.href.endsWith(".mp3")) {
            songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
        }
    }

    // function for  Populate library
    let songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";
    for (const song of songs) {

        let cleanName = song.replace(/.mp3|128 Kbps/gi, "").trim();

        songUL.innerHTML += `
        <li>
            <img class="invert" src="music.svg" alt="">
            <div class="info"><div>${song}</div></div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="play.svg" alt="">
            </div>
        </li>`;
    }

   
    Array.from(document.querySelectorAll(".songlist li")).forEach(e => {
        e.addEventListener("click", () => {
            playmusic(e.querySelector(".info").innerText.trim());
        });
    });

    return songs;
}


function playmusic(track, pause = false) {
    currentsong.src = `/${currfolder}/` + track;
    if (!pause) {
        currentsong.play();
        play.src = "pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}


async function displayalbums() {
    let a = await fetch(`/songs/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardcontainer = document.querySelector(".cardcontainer");

    for (let i = 0; i < anchors.length; i++) {
        const e = anchors[i];

        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let parts = e.href.split("/");
            let folder = parts[parts.length - 2];

            try {
                let res = await fetch(`/songs/${folder}/info.json`);
                if (!res.ok) continue;
                let info = await res.json();

                cardcontainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
            } catch {
                console.warn(`Skipping ${folder}: no info.json`);
            }
        }
    }


    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
            playmusic(songs[0], true);
        });
    });
}


async function main() {
    await getsongs("songs/ncs"); 
    playmusic(songs[0], true);

  
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "pause.svg";
        } else {
            currentsong.pause();
            play.src = "play.svg";
        }
    });

    currentsong.addEventListener("timeupdate", () => {
    let percent = (currentsong.currentTime / currentsong.duration) * 100;

    document.querySelector(".songtime").innerHTML =
        `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;

    document.querySelector(".circle").style.left = percent + "%";
    document.querySelector(".progress").style.width = percent + "%"; 
});

document.querySelector(".seekbar").addEventListener("click", e => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;

    document.querySelector(".circle").style.left = percent + "%";
    document.querySelector(".progress").style.width = percent + "%"; 
    currentsong.currentTime = (currentsong.duration * percent) / 100;
});


   
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    
    previous.addEventListener("click", () => {
        let index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index > 0) playmusic(songs[index - 1]);
    });

    
    next.addEventListener("click", () => {
        let index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index < songs.length - 1) playmusic(songs[index + 1]);
    });

   
    document.querySelector(".range input").addEventListener("input", e => {
        currentsong.volume = e.target.value / 100;
        document.querySelector(".volume>img").src = currentsong.volume > 0 ? "volume.svg" : "mute.svg";
    });

   
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = "mute.svg";
            currentsong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "volume.svg";
            currentsong.volume = 0.5;
            document.querySelector(".range input").value = 50;
        }
    });

   document.getElementById("searchInput").addEventListener("input", function () {
    let query = this.value.toLowerCase();

    // 🔍 Filter songs in the left library
    let songsList = document.querySelectorAll(".songlist li");
    songsList.forEach(song => {
        let songName = song.querySelector(".info div").innerText.toLowerCase();
        song.style.display = songName.includes(query) ? "" : "none";
    });

    // 🔍 Filter playlist cards on the right
    let cards = document.querySelectorAll(".cardContainer .card");
    cards.forEach(card => {
        let cardTitle = card.querySelector("h2").innerText.toLowerCase();
        let cardDesc = card.querySelector("p").innerText.toLowerCase();
        
        // show card if query matches title OR description
        if (cardTitle.includes(query) || cardDesc.includes(query)) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}); 

const playbarContainer = document.querySelector(".playbar-container");
const toggleBtn = document.querySelector(".miniplayer-toggle");

let mini = false;

toggleBtn.addEventListener("click", () => {
    mini = !mini;
    if (mini) {
        playbarContainer.classList.add("miniplayer");
        toggleBtn.innerText = "⇱"; // expand icon
    } else {
        playbarContainer.classList.remove("miniplayer");
        toggleBtn.innerText = "⇲"; // collapse icon
    }
});

    displayalbums();
}


main();
