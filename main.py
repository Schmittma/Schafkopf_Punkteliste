from flask import Flask, request, jsonify, send_from_directory
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from pytz import timezone
from datetime import datetime 
from server_config import SERVER_CONFIG 

app = Flask(__name__, static_folder='static')

# Google Sheets setup
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
client = gspread.authorize(creds)

# Open the Google Sheet by ID and access the specific worksheets by name
spreadsheet = client.open_by_key(SERVER_CONFIG["spreadsheet_id"])
config_sheet = spreadsheet.worksheet("Konfiguration")
playsheet_4p = spreadsheet.worksheet("Spielhistorie 4P")
playsheet_3p = spreadsheet.worksheet("Spielhistorie 3P")

@app.route('/users', methods=['GET'])
def get_users():
    # Fetch all values from the "Spieler" column
    header_row = config_sheet.row_values(1)
    spieler_col_index = header_row.index("Spieler") + 1
    spieler_col_values = config_sheet.col_values(spieler_col_index)[1:]
    return jsonify(spieler_col_values)

@app.route('/gspielt', methods=['POST'])
def add_score():
    # Add a new score to the appropriate sheet based on the number of players
    data = request.get_json()
    
    date = datetime.now(timezone('Europe/Berlin')).strftime("%d.%m.%Y %H:%M:%S")
    # Check malformed data
    if 'play' not in data or 'winner' not in data or 'wincondition' not in data:
        return jsonify({"status": "error", "message": "Missing required fields"}), 400
    
    if 'participants' not in data or len(data['participants']) not in [3, 4]:
        return jsonify({"status": "error", "message": "Invalid number of participants"}), 400
    
    if 'name' not in data['participants'][0] or 'is_player' not in data['participants'][0]:
        return jsonify({"status": "error", "message": "Invalid participant format"}), 400
    
    participants = data['participants']
    players = [p['name'] for p in participants if p['is_player']]
    non_players = [p['name'] for p in participants if not p['is_player']]
    
    if len(players) > 2 or len(non_players) < 2:
        return jsonify({"status": "error", "message": "Invalid number of players or non-players"}), 400
    
    new_row = [data['play'], data['winner'], data['wincondition']]
    
    if  len(data['participants']) == 4:
        new_row.extend(players)
        new_row.extend([''] * (2 - len(players)))
        
        new_row.extend(non_players)
        new_row.extend([''] * (4 - len(non_players)))
        
        new_row.append(date)
        
        playsheet_4p.append_row(new_row)
        
    else:
        new_row.extend(players)
        new_row.extend([''] * (1 - len(players)))
        
        new_row.extend(non_players)
        new_row.extend([''] * (3 - len(non_players)))
        
        new_row.append(date)
        
        playsheet_3p.append_row(new_row)
    
    return jsonify({"status": "success"}), 201

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)