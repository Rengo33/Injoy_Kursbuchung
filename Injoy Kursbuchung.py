import requests
import json

# URL der Webseite, an die die Daten gesendet werden sollen
url = 'https://ark-api.aciso-suite.com/api/v1/courseplan_course_joiners'  

#die Header muessen drin sein  - bleiben eigentlich immer gleich
headers = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "de",
    "Access-Control-Allow-Origin": "*",
    "Authorization": "U2FsdGVkX19tYWDztGjylJXgewt/2OTAbhwiiDUWsStmTDsf3aIZnmmEUbJCo61lw6Jm04eX22sERjxVWorwTQ==",
    "Content-Type": "application/json;charset=UTF-8",
    "Priority": "u=1, i",
    "Sec-CH-UA": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": "\"Windows\"",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site"
}
# Daten, die gesendet werden sollen
data = {
    "source": "Website",
    "first_name": "Hans",
    "last_name": "guenter",
    "email": "raffleseintraege@gmail.com",
    "phone": "4917511111111",
    "note": "Testbuchung bitte ignorieren",
    "course_id": 14926,
    "course_date": "2024-10-03T16:00:00Z",
    "domain": "https://www.injoy-wolfsburg.de",
    "center_id": 27,
    "is_paid": False,
    "ip_address": "",
    "is_agree_consent": True,
    "is_agree_cancellation_policy": True,
    "total_price": "0.00",
    "payment_method": "NONE",
    "original_price": "0.00"
}



# POST-Anfrage senden
response = requests.post(url, headers=headers, data=json.dumps(data))


# Antwort der Webseite anzeigen
print(response.status_code)  # HTTP-Statuscode
print(response.text)  # Antwortinhalt der Webseite
