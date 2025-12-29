"""
Kurs Service - Kernlogik für das Abrufen und Verarbeiten von Kursdaten
"""

import requests
import json
from datetime import datetime, timedelta
from urllib.parse import quote
from typing import Optional
from config import DISCORD_WEBHOOK_URL, API_AUTH_TOKEN, BOOKING_AUTH_TOKEN, CENTER_ID, API_BASE_URL, BOOKING_API_URL, DOMAIN


class KursService:
    """Service-Klasse für Kursplan-Operationen"""
    
    def __init__(self):
        self.headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "de",
            "authorization": API_AUTH_TOKEN,
            "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site"
        }
    
    def hole_kurse(self, tage_voraus: int = 7, start_tag: int = 1) -> list:
        """
        Holt Kurse von der API
        
        Args:
            tage_voraus: Anzahl Tage in die Zukunft (Standard: 7)
            start_tag: Ab welchem Tag (1 = morgen, 0 = heute)
        
        Returns:
            Liste der Kurse
        """
        heute = datetime.utcnow()
        
        # Zeitraum berechnen
        from_datum = heute + timedelta(days=start_tag)
        to_datum = heute + timedelta(days=tage_voraus)
        
        # Formatieren
        from_str = from_datum.strftime('%Y-%m-%d')
        to_str = to_datum.strftime('%Y-%m-%d')
        
        # URL erstellen
        url = (
            f'{API_BASE_URL}/centers/{CENTER_ID}/hybrid_courseplan'
            f'?from={quote(from_str)}T00%3A01%3A00Z'
            f'&to={quote(to_str)}T22%3A59%3A59Z'
            f'&timezone={quote(heute.strftime("%Y-%m-%dT%H:%M:%S"))}%2B01%3A00'
        )
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Fehler bei der API-Anfrage: {e}")
            return []
        except json.JSONDecodeError as e:
            print(f"Fehler beim Parsen der JSON-Daten: {e}")
            return []
    
    def erstelle_uebersicht(self, kurse: list) -> list:
        """
        Erstellt eine sortierte Übersicht der Kurse
        
        Args:
            kurse: Liste der Rohdaten
            
        Returns:
            Sortierte Liste mit Kursinfos
        """
        overview = []
        
        for course in kurse:
            name = course.get('name', 'Unbekannt')
            start_time = course.get('start_date_time')
            trainer = course.get('trainer', '') or course.get('instructor', {}).get('name', '')
            raum = course.get('room', {}).get('name', '')
            kapazitaet = course.get('capacity', 0) or 0
            gebucht = course.get('total_joiners', 0) or 0
            warteliste = course.get('total_waiting_lists', 0) or 0
            course_id = course.get('id')
            
            if start_time:
                verfuegbar = kapazitaet - gebucht if kapazitaet else 0
                overview.append({
                    'date': start_time,
                    'name': name,
                    'trainer': trainer,
                    'raum': raum,
                    'kapazitaet': kapazitaet,
                    'gebucht': gebucht,
                    'verfuegbar': max(0, verfuegbar),
                    'warteliste': warteliste,
                    'course_id': course_id,
                    'course_date': start_time
                })
        
        # Nach Datum sortieren
        return sorted(overview, key=lambda x: x['date'])
    
    def formatiere_fuer_discord(self, uebersicht: list) -> str:
        """
        Formatiert die Kursübersicht für Discord
        
        Args:
            uebersicht: Sortierte Kursliste
            
        Returns:
            Formatierte Nachricht
        """
        if not uebersicht:
            return "📭 Keine Kurse im gewählten Zeitraum gefunden."
        
        message = "🏋️ **INJOY Kursplan** 🏋️\n"
        current_date = None
        
        for entry in uebersicht:
            try:
                date_obj = datetime.fromisoformat(entry['date'].replace('Z', '+00:00'))
                date_str = date_obj.strftime('%Y-%m-%d')
                wochentag = self._get_wochentag(date_obj.weekday())
                start_time_str = date_obj.strftime('%H:%M')
                
                # Neues Datum Header
                if date_str != current_date:
                    current_date = date_str
                    message += f"\n📅 **{wochentag}, {date_obj.strftime('%d.%m.%Y')}**\n"
                
                # Kurszeile
                message += f"⏰ {start_time_str} | **{entry['name']}**"
                
                if entry.get('trainer') and entry['trainer'] != 'Unbekannt':
                    message += f" | 👤 {entry['trainer']}"
                
                if entry.get('verfuegbar') is not None:
                    message += f" | 🎫 {entry['verfuegbar']} frei"
                
                message += "\n"
                
            except (ValueError, TypeError) as e:
                print(f"Fehler beim Formatieren: {e}")
                continue
        
        return message
    
    def formatiere_fuer_html(self, uebersicht: list) -> list:
        """
        Formatiert die Kursübersicht für das HTML-Frontend
        
        Args:
            uebersicht: Sortierte Kursliste
            
        Returns:
            Liste mit formatierten Kursdaten für JSON
        """
        result = []
        
        for entry in uebersicht:
            try:
                date_obj = datetime.fromisoformat(entry['date'].replace('Z', '+00:00'))
                
                result.append({
                    'datum': date_obj.strftime('%d.%m.%Y'),
                    'wochentag': self._get_wochentag(date_obj.weekday()),
                    'uhrzeit': date_obj.strftime('%H:%M'),
                    'name': entry['name'],
                    'trainer': entry.get('trainer', ''),
                    'raum': entry.get('raum', ''),
                    'verfuegbar': entry.get('verfuegbar', 0),
                    'kapazitaet': entry.get('kapazitaet', 0),
                    'gebucht': entry.get('gebucht', 0),
                    'warteliste': entry.get('warteliste', 0),
                    'course_id': entry.get('course_id'),
                    'course_date': entry.get('course_date')
                })
            except (ValueError, TypeError):
                continue
        
        return result
    
    def _get_wochentag(self, weekday: int) -> str:
        """Gibt den deutschen Wochentag zurück"""
        tage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 
                'Freitag', 'Samstag', 'Sonntag']
        return tage[weekday] if 0 <= weekday <= 6 else ''
    
    def sende_an_discord(self, nachricht: str, webhook_url: Optional[str] = None) -> tuple[bool, str]:
        """
        Sendet eine Nachricht an Discord
        
        Args:
            nachricht: Die zu sendende Nachricht
            webhook_url: Optionale alternative Webhook URL
            
        Returns:
            Tuple (Erfolg, Nachricht)
        """
        url = webhook_url or DISCORD_WEBHOOK_URL
        
        if not url:
            return False, "Keine Webhook URL konfiguriert"
        
        # Nachricht aufteilen falls zu lang
        max_length = 2000
        messages = [nachricht[i:i + max_length] for i in range(0, len(nachricht), max_length)]
        
        try:
            for msg in messages:
                response = requests.post(
                    url,
                    json={"content": msg},
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code not in [200, 204]:
                    return False, f"Discord Fehler: {response.status_code}"
            
            return True, f"Erfolgreich gesendet ({len(messages)} Nachricht(en))"
            
        except requests.exceptions.RequestException as e:
            return False, f"Netzwerkfehler: {str(e)}"
    
    def buche_kurs(self, course_id: int, course_date: str, 
                   vorname: str, nachname: str, email: str, 
                   telefon: str = "", notiz: str = "") -> tuple[bool, str]:
        """
        Bucht einen Kurs für einen Teilnehmer
        
        Args:
            course_id: ID des Kurses
            course_date: Datum/Zeit des Kurses im ISO-Format
            vorname: Vorname des Teilnehmers
            nachname: Nachname des Teilnehmers
            email: E-Mail des Teilnehmers
            telefon: Telefonnummer (optional)
            notiz: Zusätzliche Notiz (optional)
            
        Returns:
            Tuple (Erfolg, Nachricht)
        """
        headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "de",
            "Access-Control-Allow-Origin": "*",
            "Authorization": BOOKING_AUTH_TOKEN,
            "Content-Type": "application/json;charset=UTF-8",
            "Priority": "u=1, i",
            "Sec-CH-UA": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
            "Sec-CH-UA-Mobile": "?0",
            "Sec-CH-UA-Platform": "\"Windows\"",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site"
        }
        
        # course_date muss in UTC (mit Z) sein, nicht mit lokalem Timezone
        # API gibt z.B. "2025-12-30T10:00:00+01:00" zurück, aber Buchung braucht "2025-12-30T09:00:00Z"
        if '+' in course_date:
            # Konvertiere von lokaler Zeit zu UTC
            from datetime import datetime, timezone
            try:
                # Parse das Datum mit Timezone
                dt = datetime.fromisoformat(course_date)
                # Konvertiere zu UTC
                dt_utc = dt.astimezone(timezone.utc)
                # Formatiere als UTC string mit Z
                course_date = dt_utc.strftime('%Y-%m-%dT%H:%M:%SZ')
            except ValueError:
                # Falls Parsing fehlschlägt, versuche einfache String-Manipulation
                course_date = course_date.split('+')[0] + 'Z'
        elif not course_date.endswith('Z'):
            course_date = course_date + 'Z'
        
        data = {
            "source": "Website",
            "first_name": vorname,
            "last_name": nachname,
            "email": email,
            "phone": telefon,
            "note": notiz,
            "course_id": int(course_id),
            "course_date": course_date,
            "domain": DOMAIN,
            "center_id": int(CENTER_ID),
            "is_paid": False,
            "ip_address": "",
            "is_agree_consent": True,
            "is_agree_cancellation_policy": True,
            "total_price": "0.00",
            "payment_method": "NONE",
            "original_price": "0.00"
        }
        
        # Debug-Ausgabe
        print(f"[DEBUG] Buchungsanfrage:")
        print(f"  course_id: {data['course_id']} (type: {type(data['course_id']).__name__})")
        print(f"  course_date: {data['course_date']}")
        print(f"  center_id: {data['center_id']}")
        print(f"  name: {data['first_name']} {data['last_name']}")
        print(f"  email: {data['email']}")
        
        try:
            response = requests.post(
                BOOKING_API_URL,
                headers=headers,
                data=json.dumps(data),
                timeout=30
            )
            
            # Debug-Ausgabe der Antwort
            print(f"[DEBUG] Response Status: {response.status_code}")
            print(f"[DEBUG] Response Body: {response.text[:500] if response.text else 'empty'}")
            
            if response.status_code in [200, 201]:
                return True, "Kurs erfolgreich gebucht!"
            elif response.status_code == 400:
                error_data = response.json() if response.text else {}
                error_msg = error_data.get('message', 'Buchung fehlgeschlagen - möglicherweise bereits gebucht')
                return False, error_msg
            elif response.status_code == 409:
                return False, "Du bist bereits für diesen Kurs angemeldet"
            elif response.status_code == 422:
                error_data = response.json() if response.text else {}
                error_msg = error_data.get('message', error_data.get('error', 'Ungültige Daten'))
                # Versuche Details zu extrahieren
                if 'errors' in error_data:
                    error_details = error_data['errors']
                    if isinstance(error_details, dict):
                        error_msg = ', '.join([f"{k}: {v}" for k, v in error_details.items()])
                    elif isinstance(error_details, list):
                        error_msg = ', '.join(str(e) for e in error_details)
                return False, f"Validierungsfehler: {error_msg}"
            else:
                return False, f"Fehler bei der Buchung (Status: {response.status_code})"
                
        except requests.exceptions.RequestException as e:
            return False, f"Netzwerkfehler: {str(e)}"
        except json.JSONDecodeError:
            return False, "Fehler beim Verarbeiten der Antwort"


# Für direkten Aufruf
if __name__ == "__main__":
    service = KursService()
    kurse = service.hole_kurse()
    uebersicht = service.erstelle_uebersicht(kurse)
    nachricht = service.formatiere_fuer_discord(uebersicht)
    print(nachricht)
    
    erfolg, msg = service.sende_an_discord(nachricht)
    print(f"\nDiscord: {msg}")
