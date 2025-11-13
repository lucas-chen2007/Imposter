document.addEventListener("DOMContentLoaded", () => {
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
		secretText: document.getElementById("secret-text"),
		secretPrompt: document.getElementById("secret-prompt"),
		nextPlayerBtn: document.getElementById("btn-next-player"),
		newRoundBtn: document.getElementById("btn-new-round"),
		resetBtn: document.getElementById("btn-reset")
	};

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
		if (!name) return;
		const playerName = name.charAt(0).toUpperCase() + name.slice(1);
		if (gameState.players.some(p => p.toLowerCase() === name.toLowerCase())) return;
		gameState.players.push(playerName);
		elements.playerNameInput.value = "";
		persistPlayers();
		renderPlayers();
		updateStartButton();
	}

	function persistPlayers() {
		sessionStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(gameState.players));
	}

	function loadPlayersFromStorage() {
		const stored = sessionStorage.getItem(STORAGE_KEY_PLAYERS);
		if (!stored) return;
		const parsed = JSON.parse(stored);
		if (Array.isArray(parsed)) {
			gameState.players = parsed.filter(name => typeof name === "string");
		}
	}

	function updateStartButton() {
		elements.startGameBtn.disabled = gameState.players.length < 3;
	}

	// -------------------- DRAG & DROP --------------------
	function enableDragAndDrop() {
		const listItems = elements.playersList.querySelectorAll("li");
		listItems.forEach(li => {
			li.addEventListener("dragstart", e => {
				e.dataTransfer.setData("text/plain", li.dataset.index);
				li.classList.add("dragging");
			});
			li.addEventListener("dragend", () => li.classList.remove("dragging"));
			li.addEventListener("dragover", e => e.preventDefault());
			li.addEventListener("drop", e => {
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

	function pickRandom(array) { return array[Math.floor(Math.random() * array.length)]; }

	function startRound() {
		if (gameState.players.length < 3 || !gameState.topics.length) return;
		gameState.currentRound += 1;
		gameState.playerIndex = 0;
		gameState.imposterIndex = Math.floor(Math.random() * gameState.players.length);
		gameState.currentTopic = pickRandom(gameState.topics);
		elements.revealTitle.textContent = `Round ${gameState.currentRound}`;
		updateRevealForCurrentPlayer();
		setScreen("reveal");
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
			if (gameState.currentTopic.hints.length > 0){
				const hint = pickRandom(gameState.currentTopic.hints);
				elements.secretText.textContent = `Hint: ${hint}`;
			}
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
			const discussStartEl = document.getElementById("discuss-start");
			const starter = pickRandom(gameState.players);
			discussStartEl.textContent =  `Action starts with ${starter}!`
			setScreen("discuss");
		}
	}

	function nextRoundOrEnd() { startRound(); }

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
		setScreen("setup");
	}

	// -------------------- EVENT LISTENERS --------------------
	elements.addPlayerBtn.addEventListener("click", addPlayerFromInput);
	elements.playerNameInput.addEventListener("keydown", e => {
		if (e.key === "Enter") { e.preventDefault(); addPlayerFromInput(); }
	});
	elements.playersForm.addEventListener("submit", e => { e.preventDefault(); addPlayerFromInput(); });

	elements.startGameBtn.addEventListener("click", startRound);
	elements.nextPlayerBtn.addEventListener("click", nextPlayerOrDiscuss);
	elements.newRoundBtn.addEventListener("click", nextRoundOrEnd);
	elements.resetBtn.addEventListener("click", resetGame);

	// -------------------- HOLD TO SHOW SECRET --------------------
	elements.secretBox.addEventListener("mousedown", e => { e.preventDefault(); showSecret(); });
	elements.secretBox.addEventListener("mouseup", e => { e.preventDefault(); hideSecret(); });
	elements.secretBox.addEventListener("mouseleave", hideSecret);
	elements.secretBox.addEventListener("touchstart", e => { e.preventDefault(); showSecret(); });
	elements.secretBox.addEventListener("touchend", e => { e.preventDefault(); hideSecret(); });

	// -------------------- INITIALIZE --------------------
	loadPlayersFromStorage();
	renderPlayers();
	updateStartButton();
	setScreen("setup");

	// Load topics.json
	(async () => {
		try {
			const res = await fetch("topics.json", { cache: "no-store" });
			if (!res.ok) return;
			const data = await res.json();
			if (!Array.isArray(data)) return;
			gameState.topics = data.filter(t => t && t.topic).map(t => ({
				topic: t.topic,
				hints: t.hints || []
			}));
			gameState.topicsLoaded = true;
			updateStartButton();
		} catch (err) { console.warn("Failed to load topics.json", err); }
	})();
});
