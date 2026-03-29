const defaultHeaders = {
  'Content-Type': 'application/json',
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: defaultHeaders,
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed.' }))
    throw new Error(error.message || 'Request failed.')
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/csv')) {
    return response.text()
  }

  return response.json()
}

export function downloadBlob(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
