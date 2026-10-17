// Chill page (/chill): just a lofi radio. The YouTube live stream fills the screen as the background
// (the official embed player, kept visible), with a small play / station / volume bar on top.
(() => {
    const SITE = window.SITE;
    const $ = (id) => document.getElementById(id);

    // One long lofi mix, looped forever
    const VIDEO = { id: "BYTxPFj44uo", name: "Why the rush? · chill chill journal" };

    let player = null;
    let playing = false;
    const volume = $("volume");
    try { volume.value = localStorage.getItem("chill-volume") ?? volume.value; } catch (e) { /* storage unavailable */ }

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
                videoId: VIDEO.id,
                // loop needs the video listed as its own playlist
                playerVars: { autoplay: 1, controls: 0, playsinline: 1, rel: 0, modestbranding: 1, disablekb: 1, loop: 1, playlist: VIDEO.id },
                events: {
                    onReady: (e) => { e.target.setVolume(Number(volume.value)); e.target.playVideo(); },
                    onStateChange: (e) => {
                        if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
                        else if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
                        // belt and braces: if it does end, start over
                        else if (e.data === YT.PlayerState.ENDED) { e.target.seekTo(0); e.target.playVideo(); }
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

    $("trackName").textContent = VIDEO.name;
    // Shows "play" until YouTube reports it's really playing (phones may block autoplay — one tap then starts it)
    setPlaying(false);
    SITE.onLangChange(() => setPlaying(playing));
})();
