import { useEffect, useState } from 'react';
import { fetchRecordings } from './api.js';
import './index.css';

export default function Library() {
  const [list, setList] = useState([]);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    fetchRecordings()
      .then(setList)
      .then(() => setStatus(''))
      .catch(() => setStatus('Failed to load'));
  }, []);

  return (
    <div className="container">
      <h1>Uploaded Recordings</h1>
      {status && <div className="status">{status}</div>}

      {!status && list.length === 0 && <div>No recordings yet.</div>}

      {list.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Size</th>
              <th>Created</th>
              <th>Play</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id}>
                <td>{r.title || 'Untitled'}</td>
                <td>{(r.size / (1024 * 1024)).toFixed(2)} MB</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  <video src={r.url} controls width={320} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <hr />
      <a className="link" href="/#" onClick={(e) => {
        e.preventDefault();
        window.location.hash = '';
        window.location.reload();
      }}>← Back to Recorder</a>
    </div>
  );
}
