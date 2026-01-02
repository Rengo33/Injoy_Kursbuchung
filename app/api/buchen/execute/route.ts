import { NextResponse } from 'next/server'
import { bucheKurs, BuchungsData } from '@/lib/kurs-service'

// Dieser Endpoint wird vom Scheduler (z.B. QStash) aufgerufen
export async function POST(request: Request) {
  try {
    // Sicherheitscheck: Nur autorisierte Requests (z.B. via Secret Header)
    const authHeader = request.headers.get('x-scheduler-secret')
    if (process.env.SCHEDULER_SECRET && authHeader !== process.env.SCHEDULER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: BuchungsData = await request.json()
    
    console.log(`Führe geplante Buchung aus für Kurs ${data.course_id} am ${data.course_date}`)
    
    const result = await bucheKurs(data)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Fehler bei der Ausführung der geplanten Buchung:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
