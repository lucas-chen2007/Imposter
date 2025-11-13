document.addEventListener("DOMContentLoaded", () => {
	// -------------------- ELEMENTS --------------------
	const elements = {
		screens: {
			setup: document.getElementById("screen-setup"),
			reveal: document.getElementById("screen-reveal"),
			discuss: document.getElementById("screen-discuss")
		},
		playerNameInput: document.getElementById("player-name"),
		addPlayerBtn: document.getElementById("add-player"),
		playersList: document.getElementById("players-list"),
		playersForm: document.getElementById("players-form"),
		playersError: document.getElementById("players-error"),
		startGameBtn: document.getElementById("start-game"),
		revealTitle: document.getElementById("reveal-title"),
		secretBox: document.getElementById("secret"),
		secretRole: document.getElementById("secret-role"),
		secretText: document.getElementById("secret-text"),
		secretPrompt: document.getElementById("secret-prompt"),
		nextPlayerBtn: document.getElementById("btn-next-player"),
		roundIndicator: document.getElementById("round-indicator"),
		newRoundBtn: document.getElementById("btn-new-round"),
		resetBtn: document.getElementById("btn-reset")
	};

	// -------------------- GAME STATE --------------------
	const STORAGE_KEY_PLAYERS = "loopedInPlayers";
	const gameState = {
		players: [],
		topics: [],
		currentRound: 0,
		playerIndex: 0,
		imposterIndex: null,
		currentTopic: null,
		topicsLoaded: false
	};

	// -------------------- PLAYER MANAGEMENT --------------------
	function renderPlayers() {
		elements.playersList.innerHTML = "";
		gameState.players.forEach((p, idx) => {
			const li = document.createElement("li");
			li.draggable = true;
			li.dataset.index = idx.toString();
			li.className = "players-item";

			const left = document.createElement("div");
			left.className = "li-left";
			const handle = document.createElement("span");
			handle.className = "drag-handle";
			handle.textContent = "≡";
			const name = document.createElement("span");
			name.textContent = p;
			left.append(handle, name);

			const right = document.createElement("div");
			right.className = "li-right";
			const rm = document.createElement("span");
			rm.textContent = "✖";
			rm.className = "x";
			rm.addEventListener("click", () => {
				gameState.players.splice(idx, 1);
				persistPlayers();
				renderPlayers();
				updateStartButton();
			});
			right.appendChild(rm);

			li.append(left, right);
			elements.playersList.appendChild(li);
		});

		enableDragAndDrop();
	}

	function addPlayerFromInput() {
		const name = (elements.playerNameInput.value || "").trim();
		if (!name) {
			showPlayersError("Please enter a name.");
			return;
		}
		if (gameState.players.some(p => p.toLowerCase() === name.toLowerCase())) {
			showPlayersError("Player names must be unique.");
			return;
		}
		clearPlayersError();
		gameState.players.push(name);
		elements.playerNameInput.value = "";
		elements.playerNameInput.focus();
		persistPlayers();
		renderPlayers();
		updateStartButton();
	}

	function showPlayersError(msg) {
		elements.playersError.textContent = msg;
		elements.playersError.classList.remove("muted");
		elements.playersError.classList.add("error");
		elements.playersError.style.display = "block";
	}

	function clearPlayersError() {
		elements.playersError.textContent = "";
		elements.playersError.style.display = "none";
	}

	function persistPlayers() {
		try {
			localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(gameState.players));
		} catch (err) {
			console.warn("Unable to save players:", err);
		}
	}

	function loadPlayersFromStorage() {
		try {
			const stored = localStorage.getItem(STORAGE_KEY_PLAYERS);
			if (!stored) {
				// Fresh window: no players saved yet, start blank
				gameState.players = [];
				return;
			}
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				gameState.players = parsed
					.map(name => (typeof name === "string" ? name.trim() : ""))
					.filter(Boolean);
			}
		} catch (err) {
			console.warn("Unable to load saved players:", err);
			gameState.players = [];
		}
	}

	function updateStartButton() {
		const hasMinPlayers = gameState.players.length >= 3;
		elements.startGameBtn.disabled = !hasMinPlayers;
	}

	function normalizeTopics(raw) {
		if (!Array.isArray(raw)) return [];
		return raw
			.map(entry => {
				if (!entry || typeof entry !== "object") return null;
				const topic = typeof entry.topic === "string" && entry.topic.trim()
					? entry.topic.trim()
					: (typeof entry.name === "string" ? entry.name.trim() : "");
				if (!topic) return null;
				return { topic, hints: entry.hints || [] };
			})
			.filter(Boolean);
	}

	// -------------------- DRAG & DROP --------------------
	function enableDragAndDrop() {
        const listItems = elements.playersList.querySelectorAll("li");
        listItems.forEach((li) => {
            li.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", li.dataset.index);
                li.classList.add("dragging");
            });
    
            li.addEventListener("dragend", () => {
                li.classList.remove("dragging");
            });
    
            li.addEventListener("dragover", (e) => e.preventDefault());
    
            li.addEventListener("drop", (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
                const toIndex = parseInt(li.dataset.index);
                if (fromIndex === toIndex) return;
                const moved = gameState.players.splice(fromIndex, 1)[0];
                gameState.players.splice(toIndex, 0, moved);
                persistPlayers();
                renderPlayers();
                updateStartButton();
            });
        });
    }

	// -------------------- GAME FLOW --------------------
	function setScreen(name) {
		Object.values(elements.screens).forEach(s => s.classList.remove("screen--active"));
		elements.screens[name].classList.add("screen--active");
	}

	function pickRandom(array) {
		return array[Math.floor(Math.random() * array.length)];
	}

	function startRound() {
		if (gameState.players.length < 3) {
			alert("Add at least 3 players.");
			return;
		}
		if (!gameState.topics.length) {
			alert("Topics not loaded.");
			return;
		}

		gameState.currentRound += 1;
		gameState.playerIndex = 0;
		gameState.imposterIndex = Math.floor(Math.random() * gameState.players.length);
		gameState.currentTopic = pickRandom(gameState.topics);

		updateRevealScreenHeader();
		updateRevealForCurrentPlayer();
		setScreen("reveal");
	}

	function updateRevealScreenHeader() {
		elements.revealTitle.textContent = `Round ${gameState.currentRound}`;
	}

	function updateRevealForCurrentPlayer() {
		const player = gameState.players[gameState.playerIndex];
		elements.secretPrompt.textContent = player;
		elements.secretText.textContent = "";
		elements.secretBox.classList.add("secret--concealed");
		elements.nextPlayerBtn.disabled = false;
	}

	function showSecret() {
		const isImposter = gameState.playerIndex === gameState.imposterIndex;
		elements.secretBox.classList.remove("secret--concealed");
		if (isImposter) {
			elements.secretPrompt.textContent = "YOU ARE THE IMPOSTER";
			const hint = pickRandom(gameState.currentTopic.hints);
			elements.secretText.textContent = `Hint: ${hint}`;
		} else {
			elements.secretPrompt.textContent = gameState.currentTopic.topic;
			elements.secretText.textContent = "";
		}
		elements.nextPlayerBtn.disabled = true;
	}

	function hideSecret() {
		const player = gameState.players[gameState.playerIndex];
		elements.secretBox.classList.add("secret--concealed");
		elements.secretPrompt.textContent = player;
		elements.secretText.textContent = "";
		elements.nextPlayerBtn.disabled = false;
	}

	function nextPlayerOrDiscuss() {
		if (gameState.playerIndex < gameState.players.length - 1) {
			gameState.playerIndex += 1;
			updateRevealForCurrentPlayer();
		} else {
			setScreen("discuss");
		}
	}

	function nextRoundOrEnd() {
		startRound();
	}

	function resetGame() {
		gameState.currentRound = 0;
		gameState.playerIndex = 0;
		gameState.imposterIndex = null;
		gameState.currentTopic = null;
		gameState.players = [];
		persistPlayers();
		renderPlayers();
		updateStartButton();
		elements.playerNameInput.disabled = false;
		elements.addPlayerBtn.disabled = false;
		elements.playerNameInput.value = "";
		clearPlayersError();
		setScreen("setup");
	}

	// -------------------- EVENT LISTENERS --------------------
	elements.addPlayerBtn.addEventListener("click", addPlayerFromInput);
	elements.playerNameInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addPlayerFromInput();
		}
	});
	elements.playersForm.addEventListener("submit", (e) => {
		e.preventDefault();
		addPlayerFromInput();
	});

	elements.startGameBtn.addEventListener("click", startRound);
	elements.nextPlayerBtn.addEventListener("click", nextPlayerOrDiscuss);
	elements.newRoundBtn.addEventListener("click", nextRoundOrEnd);
	elements.resetBtn.addEventListener("click", resetGame);

	// -------------------- HOLD TO SHOW SECRET --------------------
	elements.secretBox.addEventListener("mousedown", (e) => { e.preventDefault(); showSecret(); });
	elements.secretBox.addEventListener("mouseup", (e) => { e.preventDefault(); hideSecret(); });
	elements.secretBox.addEventListener("mouseleave", (e) => { hideSecret(); });
	elements.secretBox.addEventListener("touchstart", (e) => { e.preventDefault(); showSecret(); });
	elements.secretBox.addEventListener("touchend", (e) => { e.preventDefault(); hideSecret(); });

	// -------------------- INITIALIZE --------------------
	loadPlayersFromStorage();
	renderPlayers();
	updateStartButton();
	setScreen("setup");
	console.log("Imposter app loaded");

	// Load topics from topics.json when hosted over HTTP(S)
	(async () => {
		try {
			const res = await fetch("topics.json", { cache: "no-store" });
			if (!res.ok) {
				console.warn("Failed to fetch topics.json:", res.status, res.statusText);
				updateStartButton();
				return;
			}
			const data = await res.json();
			if (!Array.isArray(data)) {
				console.warn("topics.json is not an array. Got:", data);
				updateStartButton();
				return;
			}
			const normalized = normalizeTopics(data);
			if (!normalized.length) {
				console.warn("topics.json contains no valid topics.");
				updateStartButton();
				return;
			}
			gameState.topics = normalized;
			gameState.topicsLoaded = true;
			console.log(`Loaded ${normalized.length} topics`);
			updateStartButton();
		} catch (err) {
			console.warn("Error loading topics.json:", err);
			updateStartButton();
		}
	})();
});
