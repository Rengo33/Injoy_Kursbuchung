import requests
import json
import discord
from datetime import datetime, timedelta
from urllib.parse import quote


# Heutiges Datum
heute = datetime.utcnow()

# from (heute + 1 Tag)
from_datum = heute + timedelta(days=1)

# to (heute + 7 Tage)
to_datum = heute + timedelta(days=7)

# Formatieren der Daten im ISO 8601-Format
from_str = from_datum.strftime('%Y-%m-%d')
to_str = to_datum.strftime('%Y-%m-%d')

# URL-kodiertes Format (falls notwendig)
from_kodiert = quote(from_str)
to_kodiert = quote(to_str)
heute_kodiert = quote(heute.strftime('%Y-%m-%dT%H:%M:%S'))

# Deine Webhook-URL hier einfügen
webhook_url = 'https://discord.com/api/webhooks/1286699324620669009/WMiusIAqiJk9BxixE6jcJ_V_HefQfIkPr9s3VlGz3uu4eh2bPCWJRyYyjqOf8mUjtro2'

# Angenommene URL, von der die Daten abgerufen werden
url = f'https://ark-api.aciso-suite.com/api/v1/centers/27/hybrid_courseplan?from={from_kodiert}T00%3A01%3A00Z&to={to_kodiert}T22%3A59%3A59Z&timezone={heute_kodiert}%2B01%3A00'

# Headers für die Anfrage
headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "de",
    "authorization": "U2FsdGVkX1/NO8PJ04wXxWHPuksUxPqXT63GP23mPPZMZBtcD1kfAZWbCdwkOaPoIezKV+5ra7gl5ESCiGJDTw==",
    "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site"
}

# GET-Anfrage senden und die JSON-Daten abrufen
response = requests.get(url, headers=headers)

# Überprüfen, ob die Anfrage erfolgreich war
if response.status_code == 200:
    data = response.json()  # JSON-Daten extrahieren
else:
    print("Fehler bei der Anfrage:", response.status_code)
    data = []

# Übersicht erstellen
overview = []

for course in data:
    name = course.get('name')
    start_time = course.get('start_date_time')
    
    overview.append({
        'date': start_time,
        'name': name,
    })

# Sortieren der Übersicht nach Datum
overview = sorted(overview, key=lambda x: x['date'])

# Nachricht vorbereiten
message_inhalt = ""
current_date = None
for entry in overview:
    # Datum in ein Date-Objekt umwandeln
    date_obj = datetime.fromisoformat(entry['date'])  # Entfernen des 'Z' für ISO Format
    date_str = date_obj.strftime('%Y-%m-%d')  # Datum im Format JJJJ-MM-TT
    start_time_str = date_obj.strftime('%H:%M')  # Uhrzeit im Format HH:MM
    
    # Wenn das Datum wechselt, neues Datum hinzufügen
    if date_str != current_date:
        current_date = date_str
        message_inhalt += f"\n{current_date}:\n"  # Zeilenumbruch für neue Datumszeile
    
    message_inhalt += f"- Start: {start_time_str} | {entry['name']}\n"  # Zeilenumbruch nach jeder Kurszeile

# Die vollständige Nachricht in den content-Schlüssel packen
message = {"content": message_inhalt}


# Teilen der Nachricht, wenn sie länger als 2000 Zeichen ist
max_length = 2000
messages = [message_inhalt[i:i + max_length] for i in range(0, len(message_inhalt), max_length)]

length = len(message_inhalt)
print(length)
# Senden der Nachricht an den Webhook **außerhalb der Schleife**
for msg in messages:
    message = {"content": msg}
    response = requests.post(
        webhook_url, 
        data=json.dumps(message), 
        headers={"Content-Type": "application/json"}
    )

# Überprüfen, ob die Anfrage erfolgreich war
if response.status_code == 204:  # Discord gibt 204 No Content zurück, wenn die Nachricht erfolgreich gesendet wurde
    print("Nachricht erfolgreich gesendet.")
else:
    print(f"Fehler beim Senden der Nachricht: {response.status_code} - {response.text}")
