import { NextResponse } from 'next/server'
import { holeKurse } from '@/lib/kurs-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tage = parseInt(searchParams.get('tage') || '7')
  const start = parseInt(searchParams.get('start') || '1')
  
  try {
    const kurse = await holeKurse(
      Math.min(Math.max(tage, 1), 14),
      Math.min(Math.max(start, 0), 7)
    )
    
    return NextResponse.json({
      success: true,
      kurse,
      anzahl: kurse.length,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
