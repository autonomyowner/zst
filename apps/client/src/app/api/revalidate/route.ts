import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret')
    const path = request.nextUrl.searchParams.get('path')

    // Validate secret token (check both server-side and public env vars)
    const validToken = process.env.REVALIDATION_TOKEN || process.env.NEXT_PUBLIC_REVALIDATION_TOKEN
    if (!validToken || secret !== validToken) {
      return NextResponse.json(
        { message: 'Invalid token', revalidated: false },
        { status: 401 }
      )
    }

    // Validate path parameter
    if (!path) {
      return NextResponse.json(
        { message: 'Path is required', revalidated: false },
        { status: 400 }
      )
    }

    // Revalidate the specified path
    revalidatePath(path)

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      path,
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      {
        message: 'Error revalidating path',
        error: error instanceof Error ? error.message : 'Unknown error',
        revalidated: false,
      },
      { status: 500 }
    )
  }
}

