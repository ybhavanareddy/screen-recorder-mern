import { useEffect, useRef, useState } from 'react';
import { uploadRecording } from './api.js';
import './index.css';

const MAX_SECONDS = 180;

export default function App() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('');
  const [title, setTitle] = useState('');
  const [blob, setBlob] = useState(null);
  const [videoURL, setVideoURL] = useState('');
  const recorderRef = useRef(null);
  const combinedStreamRef = useRef(null);
  const timerRef = useRef(null);

  // Clean up object URL when blob changes
  useEffect(() => {
    return () => {
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [videoURL]);

  async function startRecording() {
    setStatus('');
    setBlob(null);
    setVideoURL('');
    setSeconds(0);

    try {
      // Capture current tab (user will choose tab in Chrome prompt)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true // capture tab/system audio if available
      });

      // Mic audio
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Build combined stream (video + possible tab audio + mic audio)
      const tracks = [
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
        ...micStream.getAudioTracks()
      ];
      const combined = new MediaStream(tracks);
      combinedStreamRef.current = { displayStream, micStream, combined };

      // Stop if user stops screen share manually
      const [videoTrack] = displayStream.getVideoTracks();
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          if (recording) stopRecording();
        });
      }

      // Choose supported codec
      const mimeOptions = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      const mimeType = mimeOptions.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

      const recorder = new MediaRecorder(combined, { mimeType });
      recorderRef.current = recorder;

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        setBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setVideoURL(url);

        // Cleanup streams
        stopAllStreams();
      };

      recorder.start(); // we can also pass timeslice if you want periodic chunks

      // Start timer (and enforce 3-minute cap)
      setRecording(true);
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          if (next >= MAX_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatus('Permissions denied or capture failed.');
      stopAllStreams();
      setRecording(false);
    }
  }

  function stopAllStreams() {
    try {
      ['displayStream', 'micStream', 'combined'].forEach(key => {
        const s = combinedStreamRef.current?.[key];
        s?.getTracks()?.forEach(t => t.stop());
      });
    } catch {}
    combinedStreamRef.current = null;
  }

  function stopRecording() {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecording(false);
      recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop();
    } catch (e) {
      console.error(e);
    }
  }

  function download() {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = videoURL;
    a.download = `${title || 'recording'}.webm`;
    a.click();
  }

  async function upload() {
    if (!blob) return;
    setStatus('Uploading...');
    try {
      await uploadRecording({ blob, title });
      setStatus('✅ Upload successful');
    } catch (e) {
      console.error(e);
      setStatus('❌ Upload failed');
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="container">
      <h1>Screen Recorder</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <button onClick={startRecording} disabled={recording}>
          ▶ Start
        </button>
        <button onClick={stopRecording} disabled={!recording}>
          ⏹ Stop
        </button>

        <div className={`timer ${seconds >= MAX_SECONDS ? 'limit' : ''}`}>
          {mm}:{ss} / 03:00
        </div>
      </div>

      {status && <div className="status">{status}</div>}

      {videoURL && (
        <div className="preview">
          <h2>Preview</h2>
          <video src={videoURL} controls playsInline width={720} />
          <div className="actions">
            <button onClick={download}>⬇ Download</button>
            <button onClick={upload}>⬆ Upload to Backend</button>
          </div>
        </div>
      )}

      <hr />
      <a className="link" href="/#library" onClick={(e) => {
        e.preventDefault();
        window.location.hash = 'library';
        window.location.reload();
      }}>Go to Recordings List →</a>
    </div>
  );
}
