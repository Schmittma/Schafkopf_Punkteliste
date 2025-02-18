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

def get_col_by_name(sheet, name):
    header_row = sheet.row_values(1)
    return header_row.index(name) + 1

# Helper function to append the values from the previous row to the new row
# HIghly dependent on the acutal contents of the sheet
# However i was not able to get a trigger in the sheet directly to work
def append_values_from_previous_columns(response, sheet):
    # use join(filter(str.isdigit, ...)) To seperate the index from the letter
    # The repsonse contains the range until the previous row
    previous_row_index = ''.join(filter(str.isdigit, response['tableRange'].split(':')[1]))
    new_row_index = int(previous_row_index) + 1
    
    target_col = get_col_by_name(sheet, "Wert")
    
    previous_cell = sheet.cell(int(previous_row_index), target_col, value_render_option='FORMULA')
    
    # Handle the cost column
    content_to_copy = previous_cell.value.replace(previous_row_index, str(new_row_index))
    sheet.update_cell(int(new_row_index), target_col, content_to_copy)

@app.route('/sheet', methods=['GET'])
def get_sheet_link():
    return jsonify({"link": f"https://docs.google.com/spreadsheets/d/{SERVER_CONFIG['spreadsheet_id']}"})

@app.route('/users', methods=['GET'])
def get_users():
    # Fetch all values from the "Spieler" column
    spieler_col_index = get_col_by_name(config_sheet, "Spieler")
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
    
    running = data['running']
    
    if (data['play'] == 'Solo' and running < 2) or ((data['play'] == 'Ruf' or data['play'] == 'Ramsch') and running < 3):
        running = 0
    
    new_row = [data['play'], data['winner'], data['wincondition'], running]
    
    try:
        if  len(data['participants']) == 4:
            new_row.extend(players)
            new_row.extend([''] * (2 - len(players)))
            
            new_row.extend(non_players)
            new_row.extend([''] * (4 - len(non_players)))
            
            new_row.append(date)
            
            response = playsheet_4p.append_row(new_row)
            
            append_values_from_previous_columns(response, playsheet_4p)
            
        else:
            new_row.extend(players)
            new_row.extend([''] * (1 - len(players)))
            
            new_row.extend(non_players)
            new_row.extend([''] * (3 - len(non_players)))
            
            new_row.append(date)
            
            response = playsheet_3p.append_row(new_row)
            
            append_values_from_previous_columns(response, playsheet_3p)
        
        if response['updates']['updatedRows'] != 1:
            return jsonify({"status": "error", "message": "Server error. Play was not submitted."}), 500
        else:             
            return jsonify({"status": "success"}), 201
        
        
    except Exception as e:
        print(e)
        return jsonify({"status": "error", "message": "Server error. Play was not submitted."}), 500

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)