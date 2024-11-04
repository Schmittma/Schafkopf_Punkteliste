let globalNumPlayers = 0;
let maxAllowedPlayers = 0;
let playerIsPlayer = [false, false, false, false];

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

function closePopup(event) {
    if (event && event.target !== document.querySelector('.popup-content') && !document.querySelector('.popup-content').contains(event.target)) {
        document.getElementById('win-condition-popup').style.display = 'none';
    } else if (!event) {
        document.getElementById('win-condition-popup').style.display = 'none';
    }
}

function showWinConditionPopup(event) {
    event.preventDefault();
    if(playerIsPlayer.filter(p => p).length === maxAllowedPlayers) {
        document.getElementById('win-condition-popup').style.display = 'block';
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

function togglePlayerState(playerNum) {
    // Only 2 players can be players in a 4 player game
    // Only 1 player can be a player in a 3 player game
    if (!playerIsPlayer[playerNum - 1] &&
        (playerIsPlayer.filter(p => p).length >= maxAllowedPlayers)) {
        return;
    }

    playerIsPlayer[playerNum - 1] = !playerIsPlayer[playerNum - 1];
    colorPlayer(playerNum);
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

function submitForm(event) {
    const playType = document.getElementById('play-type').value;
    const winCondition = document.querySelector('input[name="wincondition"]:checked').value;
    const winner = document.querySelector('input[name="winner"]:checked').value;
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
