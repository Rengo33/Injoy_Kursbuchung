"""
Flask Web-App für Injoy Kurs Buchung
Ein einfaches Frontend für deine Mutter 🎉
"""

from flask import Flask, render_template, jsonify, request
from kurs_service import KursService

app = Flask(__name__)
service = KursService()


@app.route('/')
def index():
    """Hauptseite"""
    return render_template('index.html')


@app.route('/api/kurse')
def get_kurse():
    """API Endpoint für Kurse"""
    try:
        tage = int(request.args.get('tage', 7))
        start = int(request.args.get('start', 1))
        
        # Begrenzen auf sinnvolle Werte
        tage = min(max(tage, 1), 14)
        start = min(max(start, 0), 7)
        
        kurse = service.hole_kurse(tage_voraus=tage, start_tag=start)
        uebersicht = service.erstelle_uebersicht(kurse)
        formatiert = service.formatiere_fuer_html(uebersicht)
        
        return jsonify({
            'success': True,
            'kurse': formatiert,
            'anzahl': len(formatiert)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/discord', methods=['POST'])
def send_discord():
    """Sendet Kursplan an Discord"""
    try:
        tage = int(request.json.get('tage', 7)) if request.json else 7
        
        kurse = service.hole_kurse(tage_voraus=tage)
        uebersicht = service.erstelle_uebersicht(kurse)
        nachricht = service.formatiere_fuer_discord(uebersicht)
        
        erfolg, msg = service.sende_an_discord(nachricht)
        
        return jsonify({
            'success': erfolg,
            'message': msg
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/buchen', methods=['POST'])
def buche_kurs():
    """Bucht einen Kurs für einen Teilnehmer"""
    try:
        data = request.json
        
        # Pflichtfelder prüfen
        required = ['course_id', 'course_date', 'vorname', 'nachname', 'email']
        for field in required:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Feld "{field}" ist erforderlich'
                }), 400
        
        erfolg, msg = service.buche_kurs(
            course_id=int(data['course_id']),
            course_date=data['course_date'],
            vorname=data['vorname'],
            nachname=data['nachname'],
            email=data['email'],
            telefon=data.get('telefon', ''),
            notiz=data.get('notiz', '')
        )
        
        return jsonify({
            'success': erfolg,
            'message': msg
        })
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': 'Ungültige Kurs-ID'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("🏋️ Injoy Kurs-App gestartet!")
    print("📱 Öffne http://localhost:5000 im Browser")
    app.run(debug=True, host='0.0.0.0', port=5000)
