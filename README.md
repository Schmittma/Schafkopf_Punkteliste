# Schafkopf Punkteliste
This repository contains the Back- and Frontend for entering scores in Schafkopf.
The Front-End issues REST calls to the server which then interacts with a Google Sheet.

## Set-Up
1. Clone the Repository
2. Set-Up the Google API
    1. Create the Google Sheet. A template can be found .... See ... for a list of hard-coded cell dependencies
    2. Enter the ID of the spreadsheet into server_config.py
    3. Follow [this guide by Google](https://developers.google.com/workspace/guides/create-credentials) to create your access credentials
    4. Copy your credentials.json into the root directory of this application
3. Start the server
   1. By calling main.py directly for development purposes
   2. By using the wsgi.py endpoint file with e.g. Gunicorn
4. Configure your reverse Proxy (Nginx, Apache, etc.) to forward requests to the webserver


## Technologies
+ The server runs on flask to provide the static website and a REST API for communication with the server. 
+ The front-end is a basic HTML+JS website.
+ The actually storage for the data is a Google Sheet. This makes interacting, filtering or correcting the data quite easy from anywhere.

## REST API
### Endpoint /users

### Endpoint /sheet

### Endpoint /gspielt

4 Spieler Spiel:
```json
{
    "play": "Ruf" | "Solo" | "Ramsch",
    "winner": "spieler" | "Nicht-Spieler",
    "wincondition": "normal" | "schneider" | "schwarz",
    "running": 0-8,
    "participants": [
        { "name": "Name player1>", "is_player": true },
        { "name": "Name player2>", "is_player": false },
        { "name": "Name player3>", "is_player": true },
        { "name": "Name player4>", "is_player": false }
    ]
}
```

3 Spieler Spiel:
```json
{
    "play": "Solo" | "Ramsch",
    "winner": "spieler" | "nicht-spieler",
    "wincondition": "normal" | "schneider" | "schwarz",
    "running": 0-8,
    "participants": [
        { "name": "Name player1", "is_player": true },
        { "name": "Name player2", "is_player": false },
        { "name": "Name player3", "is_player": true },
        { "name": "Name player4", "is_player": false }
    ]
}
```