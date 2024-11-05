// ----------------- Global variables -----------------
let globalNumPlayers = 0;
let maxAllowedPlayers = 0;
let playerIsPlayer = [false, false, false, false];


// ----------------- Handle DOM Loaded -----------------
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePopup();
        }
    });

    fetch('/users')
        .then(response => response.json())
        .then(data => {
            const playerSelects = document.querySelectorAll('select.player-select');
            playerSelects.forEach(select => {
                const defaultOption = document.createElement('option');
                defaultOption.value = "";
                defaultOption.textContent = "Spieler";
                defaultOption.disabled = true;
                defaultOption.selected = true;
                select.appendChild(defaultOption);

                data.forEach(player => {
                    const option = document.createElement('option');
                    option.value = player;
                    option.textContent = player;
                    select.appendChild(option);
                });
                select.addEventListener('change', handlePlayerSelection);
            });
        });
});

// ----------------- Handle the player state information -----------------

function togglePlayerState(playerNum) {
    // Only 2 players can be players in a Ruf
    // Only 1 player can be a player in a Solo
    if (!playerIsPlayer[playerNum - 1] &&
        (playerIsPlayer.filter(p => p).length >= maxAllowedPlayers)) {
        return;
    }

    playerIsPlayer[playerNum - 1] = !playerIsPlayer[playerNum - 1];
    colorPlayer(playerNum);
}

function resetPlayerIsPlayer() {
    playerIsPlayer = [false, false, false, false];
    for(let i = 1; i <= 4; i++) {
        colorPlayer(i);
    }
}

function updatePlayType() {
    resetPlayerIsPlayer();
    const playType = document.getElementById('play-type').value;
    if (playType === 'Ruf') {
        maxAllowedPlayers = 2;
    }
    else {
        maxAllowedPlayers = 1;
    }
}


function handlePlayerSelection(event) {
    if(event.target.options[0].value === "") {
        event.target.options[0].remove();
    }

    const selectedOptions = new Set();
    const playerSelects = document.querySelectorAll('select.player-select');
    playerSelects.forEach(select => {
        if (select.value) {
            selectedOptions.add(select.value);
        }
    });

    playerSelects.forEach(select => {
        const options = select.querySelectorAll('option');
        options.forEach(option => {
            if ((selectedOptions.has(option.value) && option.value !== select.value) || (option.value === "")) {
                option.disabled = true;
            } else {
                option.disabled = false;
            }
        });
    });
}


// ----------------- Handle the UI -----------------
/*
    This function initializes the main player selection screen.
    Depending on the selected number of players, this will show 3 or 4 players.

    It also initializes the play-type selection button based on the number of players.
*/
function showPlayersScreen(numPlayers) {
    globalNumPlayers = numPlayers; 
    document.getElementById('player-selection').style.display = 'none';
    document.getElementById('player-names').style.display = 'block';
    for (let i = 1; i <= numPlayers; i++) {
        document.getElementById(`player${i}-container`).style.display = 'flex';
    }

    const playType = document.getElementById('play-type');
    if (numPlayers === 4) {
        const rufOption = document.createElement('option');
        rufOption.value = 'Ruf';
        rufOption.textContent = 'Ruf';
        playType.appendChild(rufOption);
        maxAllowedPlayers = 2;
    }
    else {
        maxAllowedPlayers = 1;
    }

    const soloOption = document.createElement('option');
    soloOption.value = 'Solo';
    soloOption.textContent = 'Solo';
    playType.appendChild(soloOption);

    const ramschOption = document.createElement('option');
    ramschOption.value = 'Ramsch';
    ramschOption.textContent = 'Ramsch';
    playType.appendChild(ramschOption);

    resetPlayerIsPlayer();
}

function colorPlayer(playerNum) {
    const player = document.getElementById(`player${playerNum}`);
    if (playerIsPlayer[playerNum - 1]) {
        player.style.backgroundColor = '#D4EDDA';
    }
    else {
        player.style.backgroundColor = '#F0F0F0';
    }
}

// ----------------- Handle the win condition popup -----------------

function closePopup(event) {
    if (event && event.target !== document.querySelector('.popup-content') && !document.querySelector('.popup-content').contains(event.target)) {
        document.getElementById('win-condition-popup').style.display = 'none';
    } else if (!event) {
        document.getElementById('win-condition-popup').style.display = 'none';
    }
}

/*
    Depending on whether Ramsch is selected, we need to show different win conditions
    For Ruf and Solo we always show the "ruf-solo-wincondition" radio group.
     
    For Ramsch, if the "non-players" win, we show the "ramsch-wincondition" radio group.
    Otherwise, if the "player" wins, there is no further modification to the win condition. 
*/
function showWinConditionPopup(event) {
    event.preventDefault();
    if(playerIsPlayer.filter(p => p).length === maxAllowedPlayers) {

        const playType = document.getElementById('play-type').value;

        // Initially assume non-players win for ramsch
        if (playType === 'Ramsch') {
            document.getElementById('ramsch-wincondition__normal').checked = true;
            document.getElementById('wincondition__nicht-spieler').checked = true;
            document.getElementById('ruf-solo-wincondition').style.display = 'none';
            document.getElementById('ramsch-wincondition').style.display = 'flex';
        }
        else {
            document.getElementById('ruf-solo-wincondition__normal').checked = true;
            document.getElementById('wincondition__spieler').checked = true;
            document.getElementById('ruf-solo-wincondition').style.display = 'flex';
            document.getElementById('ramsch-wincondition').style.display = 'none';
        }

        document.getElementById('win-condition-popup').style.display = 'block';
    }
}

/*
    Only required for Ramsch.
    If the non-players win, we need to show the "ramsch-wincondition" radio group. 
    Otherwise we hide it.
*/
function handleChangeWinningPlayer(event) {
    const playType = document.getElementById('play-type').value;
    if ((playType === 'Ramsch') && (event.target.value === 'nicht-spieler')) {
        document.getElementById('ramsch-wincondition').style.display = 'flex';
    } else {
        document.getElementById('ramsch-wincondition').style.display = 'none';
    }
}

/*
    Get the data from the buttons and send it to the server. 
    Called when the win condition popup is submitted.

    See the README for the data structure that is sent to the server.
*/
function submitForm(event) {
    const playType = document.getElementById('play-type').value;
    
    let winCondition = null;
    const winner = document.querySelector('input[name="winner"]:checked').value;

    if(playType === "Ruf" || playType === "Solo") {
        winCondition = document.querySelector('input[name="ruf-solo-wincondition"]:checked').value;
    } else if(winner === "nicht-spieler") {
        winCondition = document.querySelector('input[name="ramsch-wincondition"]:checked').value;
    } else {
        winCondition = "normal";
    }


    const participants = [];

    let valid = true;
    for (let i = 1; i <= globalNumPlayers; i++) {
        let select = document.getElementById(`player${i}`)

        if (select.value === "") {
            valid = false;
        }
        
        participants.push({ name: select.value, is_player: playerIsPlayer[i-1] });
    }

    if (!valid) {
        alert('Ungültige Spieler ausgewählt');
        document.getElementById('win-condition-popup').style.display = 'none';
        return;
    }

    const data = {
        play: playType,
        winner: winner,
        wincondition: winCondition,
        participants: participants
    };

    fetch('/gspielt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            showCustomAlert('Spiel eingetragen!');
        } else {
            alert('Error: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });

    document.getElementById('win-condition-popup').style.display = 'none';
    resetPlayerIsPlayer();
}

// ----------------- Custom HTML elements -----------------
/*
    Show a custom alert message for 3 seconds. The alert will fade in and out.
    The UI will still be clickable while the alert is shown.
*/
function showCustomAlert(message) {
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.classList.add('show');
    }, 100);
    setTimeout(() => {
        alertBox.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(alertBox);
        }, 300);
    }, 3000);
}
