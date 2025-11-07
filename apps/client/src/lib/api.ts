export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'

export async function getHealth(): Promise<{ status: string; uptime: number }> {
  const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`)
  }
  return res.json()
}

export async function transcribeVoice(audioBlob: Blob): Promise<{ text: string }> {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  const res = await fetch(`${API_BASE_URL}/api/voice/transcribe`, {
    method: 'POST',
    body: form
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Transcription failed: ${res.status} ${text}`)
  }
  return res.json()
}

// Live voice session (mock-first, SSE)
export async function createVoiceSession(): Promise<{ sessionId: string }> {
  const res = await fetch(`${API_BASE_URL}/api/voice/session`, { method: 'POST' })
  if (!res.ok) throw new Error(`Create voice session failed: ${res.status}`)
  return res.json()
}

export function streamVoiceSession(sessionId: string, onEvent: (evt: { type: 'transcript'|'summary'|'heartbeat'; data: unknown }) => void): EventSource {
  const es = new EventSource(`${API_BASE_URL}/api/voice/session/${sessionId}/stream`)
  es.addEventListener('transcript', (e) => onEvent({ type: 'transcript', data: JSON.parse((e as MessageEvent).data) }))
  es.addEventListener('summary', (e) => onEvent({ type: 'summary', data: JSON.parse((e as MessageEvent).data) }))
  es.addEventListener('heartbeat', (e) => onEvent({ type: 'heartbeat', data: JSON.parse((e as MessageEvent).data) }))
  return es
}

export async function sendVoiceChunk(sessionId: string, blob: Blob): Promise<void> {
  const form = new FormData()
  form.append('audio', blob, 'chunk.webm')
  const res = await fetch(`${API_BASE_URL}/api/voice/session/${sessionId}/chunk`, {
    method: 'POST',
    body: form
  })
  if (!res.ok) throw new Error(`Send chunk failed: ${res.status}`)
}

export async function finishVoiceSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/voice/session/${sessionId}/finish`, { method: 'POST' })
  if (!res.ok) throw new Error(`Finish session failed: ${res.status}`)
}


