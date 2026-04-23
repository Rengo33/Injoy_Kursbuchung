import { NextResponse } from 'next/server'
import { bucheKurs, BuchungsData } from '@/lib/kurs-service'
import { CONFIG } from '@/lib/config'

export async function POST(request: Request) {
  try {
    // Jitter gegen gleichzeitige Aufrufe (mehrere Auto-Bookings zur selben Sekunde)
    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 301)))

    const authHeader = request.headers.get('x-scheduler-secret')
      || request.headers.get('upstash-forward-x-scheduler-secret')
    if (CONFIG.SCHEDULER_SECRET && authHeader !== CONFIG.SCHEDULER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: BuchungsData = await request.json()
    const result = await bucheKurs(data)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Geplante Buchung fehlgeschlagen:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
