export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function uploadRecording({ blob, title }) {
  const fd = new FormData();
  fd.append('file', blob, `${title || 'recording'}.webm`);
  fd.append('title', title || 'Untitled');

  const res = await fetch(`${API_URL}/api/recordings`, {
    method: 'POST',
    body: fd
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function fetchRecordings() {
  const res = await fetch(`${API_URL}/api/recordings`);
  if (!res.ok) throw new Error('Fetch failed');
  return res.json();
}
