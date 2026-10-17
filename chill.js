// Chill page (/chill): just a lofi radio. The YouTube live stream fills the screen as the background
// (the official embed player, kept visible), with a small play / station / volume bar on top.
(() => {
    const SITE = window.SITE;
    const $ = (id) => document.getElementById(id);

    const STATIONS = [
        { id: "jfKfPfyJRdk", name: "lofi hip hop radio" },
        { id: "28KRPhVzCus", name: "sleepy lofi" },
        { id: "HuFYqnbVbzY", name: "jazz lofi" },
        { id: "7NOSDKb0HlU", name: "chillhop radio" },
        { id: "4xDzrJKXOOY", name: "synthwave radio" },
    ];

    let index = 0;
    try { index = Math.max(0, STATIONS.findIndex(s => s.id === localStorage.getItem("chill-station"))); } catch (e) { /* storage unavailable */ }

    let player = null;
    let playing = false;
    const volume = $("volume");
    try { volume.value = localStorage.getItem("chill-volume") ?? volume.value; } catch (e) { /* storage unavailable */ }

    const showStation = () => { $("stationName").textContent = STATIONS[index].name; };

    const setPlaying = (isPlaying) => {
        playing = isPlaying;
        $("playBtn").classList.toggle("is-paused", !isPlaying);
        $("playBtn").setAttribute("aria-label", SITE.t(isPlaying ? "chill.pause" : "chill.play"));
    };

    // The YouTube player only loads after the first click (autoplay with sound needs one anyway)
    function start() {
        $("startBtn").hidden = true;
        $("controls").hidden = false;
        document.body.classList.add("is-on");

        window.onYouTubeIframeAPIReady = () => {
            player = new YT.Player("ytPlayer", {
                videoId: STATIONS[index].id,
                playerVars: { autoplay: 1, controls: 0, playsinline: 1, rel: 0, modestbranding: 1, disablekb: 1 },
                events: {
                    onReady: (e) => { e.target.setVolume(Number(volume.value)); e.target.playVideo(); },
                    onStateChange: (e) => {
                        if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
                        else if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
                    },
                },
            });
        };
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    }

    $("startBtn").addEventListener("click", start);

    $("playBtn").addEventListener("click", () => {
        if (!player) return;
        if (playing) player.pauseVideo();
        else player.playVideo();
    });

    $("nextBtn").addEventListener("click", () => {
        index = (index + 1) % STATIONS.length;
        try { localStorage.setItem("chill-station", STATIONS[index].id); } catch (e) { /* storage unavailable */ }
        showStation();
        if (player && player.loadVideoById) player.loadVideoById(STATIONS[index].id);
    });

    volume.addEventListener("input", () => {
        if (player && player.setVolume) player.setVolume(Number(volume.value));
        try { localStorage.setItem("chill-volume", volume.value); } catch (e) { /* storage unavailable */ }
    });

    // Space toggles play/pause
    document.addEventListener("keydown", (e) => {
        if (e.code !== "Space" || e.target.closest("input, button")) return;
        e.preventDefault();
        if (!player) start();
        else $("playBtn").click();
    });

    showStation();
    // Shows "play" until YouTube reports it's really playing (phones may block autoplay — one tap then starts it)
    setPlaying(false);
    SITE.onLangChange(() => setPlaying(playing));
})();
