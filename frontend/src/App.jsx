import { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Extraer nombre del curso de la URL
      let courseName = 'curso-microsoft-learn';
      try {
        const match = url.match(/\/modules\/([^\/]+)/);
        if (match && match[1]) {
          courseName = match[1];
        }
      } catch (e) {}
      const fileName = `${courseName}.docx`;

      let fileHandle = null;

      // 1. Pedir al usuario dónde guardarlo ANTES de la petición larga
      // para no perder el "gesto del usuario" (transient user activation)
      if (window.showSaveFilePicker) {
        try {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'Word Document',
              accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
            }],
          });
        } catch (err) {
          if (err.name === 'AbortError') {
            setLoading(false);
            return; // Usuario canceló el diálogo
          }
          console.error('File picker error:', err);
        }
      }

      // 2. Pedir al backend que genere el docx
      const response = await fetch('http://localhost:3001/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el curso');
      }

      const blob = await response.blob();

      // 3. Escribir el archivo
      if (fileHandle) {
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(blob);
        await writableStream.close();
        setSuccess(true);
      } else {
        // Fallback
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(objectUrl);
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Learn Downloader</h1>
        <p className="subtitle">Descarga cualquier curso de Microsoft Learn como un documento de Word.</p>
        
        <form onSubmit={handleDownload}>
          <div className="input-group">
            <input 
              type="url" 
              placeholder="https://learn.microsoft.com/..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading || !url}>
            {loading ? <span className="spinner"></span> : 'Descargar Curso'}
          </button>
        </form>

        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">¡Curso descargado con éxito!</div>}
      </div>
    </div>
  );
}

export default App;
