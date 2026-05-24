let SIZE = 9

let board = []
let currentPlayer = 1

let blackPrisoners = 0
let whitePrisoners = 0

function init() {
    SIZE = parseInt(document.getElementById("boardSize").value)

    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))

    currentPlayer = 1
    blackPrisoners = 0
    whitePrisoners = 0

    document.getElementById("board").style.gridTemplateColumns =
        "repeat(" + SIZE + ",40px)"

    render()
    updateInfo()
}

function render() {
    const boardDiv = document.getElementById("board")
    boardDiv.innerHTML = ""

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            let cell = document.createElement("div")
            cell.className = "cell"
            cell.onclick = () => play(r, c)

            if (board[r][c] !== 0) {
                let stone = document.createElement("div")
                stone.className = "stone " + (board[r][c] === 1 ? "black" : "white")
                cell.appendChild(stone)
            }

            boardDiv.appendChild(cell)
        }
    }
}

function play(r, c) {
    if (board[r][c] !== 0) return

    board[r][c] = currentPlayer
    checkCaptures(r, c)

    currentPlayer = currentPlayer === 1 ? 2 : 1

    render()
    updateInfo()

    if (currentPlayer === 2 && document.getElementById("gameMode").value === "pve") {
        setTimeout(aiPlay, 350)
    }
}

function neighbors(r, c) {
    return [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1]
    ].filter(([x, y]) => x >= 0 && x < SIZE && y >= 0 && y < SIZE)
}

function group(r, c, visited = new Set()) {
    let color = board[r][c]
    let stack = [[r, c]]
    let stones = []

    while (stack.length) {
        let [x, y] = stack.pop()
        let key = x + "," + y

        if (visited.has(key)) continue

        visited.add(key)
        stones.push([x, y])

        for (let [nx, ny] of neighbors(x, y)) {
            if (board[nx][ny] === color) stack.push([nx, ny])
        }
    }

    return stones
}

function liberties(stones) {
    let lib = new Set()

    for (let [x, y] of stones) {
        for (let [nx, ny] of neighbors(x, y)) {
            if (board[nx][ny] === 0) {
                lib.add(nx + "," + ny)
            }
        }
    }

    return lib.size
}

function remove(stones) {
    let color = board[stones[0][0]][stones[0][1]]

    for (let [x, y] of stones) {
        board[x][y] = 0
    }

    if (color === 1) {
        whitePrisoners += stones.length
    } else {
        blackPrisoners += stones.length
    }
}

function checkCaptures(r, c) {
    let opponent = currentPlayer === 1 ? 2 : 1

    for (let [nx, ny] of neighbors(r, c)) {
        if (board[nx][ny] === opponent) {
            let g = group(nx, ny)
            if (liberties(g) === 0) {
                remove(g)
            }
        }
    }
}

function updateInfo() {
    document.getElementById("player").textContent = currentPlayer === 1 ? "Noir" : "Blanc"
    document.getElementById("blackPrisoners").textContent = blackPrisoners
    document.getElementById("whitePrisoners").textContent = whitePrisoners
}

function getEmptyCells() {
    let emptyCells = []

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) {
                emptyCells.push([r, c])
            }
        }
    }

    return emptyCells
}

function getAdjacentOccupiedScore(r, c) {
    let score = 0

    for (let [nr, nc] of neighbors(r, c)) {
        if (board[nr][nc] !== 0) {
            score++
        }
    }

    return score
}

function wouldCapture(r, c, aiColor) {
    if (board[r][c] !== 0) return false

    let backupBoard = board.map(row => [...row])
    let backupBlack = blackPrisoners
    let backupWhite = whitePrisoners

    board[r][c] = aiColor
    let beforeBlack = blackPrisoners
    let beforeWhite = whitePrisoners

    checkCaptures(r, c)

    let captured = (blackPrisoners > beforeBlack || whitePrisoners > beforeWhite)

    board = backupBoard
    blackPrisoners = backupBlack
    whitePrisoners = backupWhite

    return captured
}

function aiPlay() {
    if (document.getElementById("gameMode").value !== "pve") return
    if (currentPlayer !== 2) return

    const difficulty = document.getElementById("difficulty").value
    const emptyCells = getEmptyCells()

    if (emptyCells.length === 0) return

    if (difficulty === "easy") {
        let move = emptyCells[Math.floor(Math.random() * emptyCells.length)]
        play(move[0], move[1])
        return
    }

    if (difficulty === "medium") {
        let scoredMoves = emptyCells.map(([r, c]) => ({
            r,
            c,
            score: getAdjacentOccupiedScore(r, c)
        }))

        scoredMoves.sort((a, b) => b.score - a.score)

        let bestMoves = scoredMoves.filter(m => m.score === scoredMoves[0].score)
        let move = bestMoves[Math.floor(Math.random() * bestMoves.length)]

        play(move.r, move.c)
        return
    }

    if (difficulty === "hard") {
        let captureMoves = emptyCells.filter(([r, c]) => wouldCapture(r, c, 2))

        if (captureMoves.length > 0) {
            let move = captureMoves[Math.floor(Math.random() * captureMoves.length)]
            play(move[0], move[1])
            return
        }

        let scoredMoves = emptyCells.map(([r, c]) => ({
            r,
            c,
            score: getAdjacentOccupiedScore(r, c)
        }))

        scoredMoves.sort((a, b) => b.score - a.score)

        let bestMoves = scoredMoves.filter(m => m.score === scoredMoves[0].score)
        let move = bestMoves[Math.floor(Math.random() * bestMoves.length)]

        play(move.r, move.c)
    }
}

document.getElementById("newGame").onclick = init

document.getElementById("pass").onclick = () => {
    currentPlayer = currentPlayer === 1 ? 2 : 1
    updateInfo()

    if (currentPlayer === 2 && document.getElementById("gameMode").value === "pve") {
        setTimeout(aiPlay, 350)
    }
}

init()