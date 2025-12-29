import { NextResponse } from 'next/server'
import { bucheKurs, BuchungsData } from '@/lib/kurs-service'

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
    
    const result = await bucheKurs(data)
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
