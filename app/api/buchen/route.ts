import { NextResponse } from 'next/server'
import { bucheKurs, BuchungsData, berechneTargetZeitpunkt } from '@/lib/kurs-service'

export async function POST(request: Request) {
  try {
    const data: BuchungsData = await request.json()
    
    // Validate required fields
    const required = ['course_id', 'course_date', 'vorname', 'nachname', 'email']
    for (const field of required) {
      if (!data[field as keyof BuchungsData]) {
        return NextResponse.json(
          { success: false, error: `Feld "${field}" ist erforderlich` },
          { status: 400 }
        )
      }
    }

    const targetZeit = berechneTargetZeitpunkt(data.course_date)
    const jetzt = new Date()
    const diffMs = targetZeit.getTime() - jetzt.getTime()

    // Wenn der Zielzeitpunkt mehr als 5 Sekunden in der Zukunft liegt, planen wir die Buchung
    if (diffMs > 5000) {
      console.log(`Buchung geplant für: ${targetZeit.toLocaleString('de-DE')}`)
      
      const qstashUrl = `https://qstash.upstash.io/v2/publish/${process.env.APP_URL}/api/buchen/execute`
      
      const response = await fetch(qstashUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
          'Content-Type': 'application/json',
          'Upstash-Delay': `${Math.floor(diffMs / 1000)}s`,
          'x-scheduler-secret': process.env.SCHEDULER_SECRET || ''
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`QStash Error: ${response.status} - ${errorText}`)
      }

      return NextResponse.json({ 
        success: true, 
        message: `Buchung wurde für den ${targetZeit.toLocaleString('de-DE')} geplant (1 Tag und 3s vor Beginn).`,
        scheduled: true,
        targetTime: targetZeit.toISOString()
      })
    }
    
    // Wenn wir bereits im Zeitfenster sind (oder kurz davor), führen wir sie sofort aus
    const result = await bucheKurs(data)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
