# Learn Downloader

Una aplicación web completa para descargar cursos y módulos de **Microsoft Learn** y convertirlos en documentos de Word (.docx) formateados, extrayendo texto, estructuras y las imágenes correspondientes.

## Arquitectura del Proyecto

El proyecto está dividido en dos partes principales para sortear restricciones de seguridad del navegador (CORS) y evitar bloqueos por parte de los servidores de Microsoft:

### 1. Frontend (`/frontend`)
Desarrollado con **React** y empaquetado con **Vite**.
- Proporciona una interfaz de usuario minimalista y moderna ("Dark Mode" con diseño glassmorphism).
- Se encarga de solicitar al usuario la URL del módulo.
- Utiliza la **File System Access API** (`window.showSaveFilePicker`) de los navegadores modernos para preguntar al usuario en qué lugar de su disco local desea guardar el archivo, *antes* de iniciar el proceso, evitando así la caducidad del "gesto del usuario" (transient user activation) por motivos de seguridad en operaciones largas.
- Si el navegador no soporta dicha API, cae en un *fallback* tradicional de descarga (etiqueta `<a>`).
- El nombre del archivo Word sugerido se extrae dinámicamente de la URL proporcionada.

### 2. Backend (`/backend`)
Desarrollado en **Node.js** con **Express**.
- Expone un endpoint `POST /api/download` que recibe la URL del módulo.
- **Scraper (`scraper.js`)**: Utiliza `fetch` nativo junto con `cheerio` para descargar y parsear el HTML. 
  - Primero detecta todos los enlaces que pertenecen a las unidades relativas del módulo.
  - Luego visita cada unidad, leyendo selectivamente su etiqueta `<main>` para extraer texto estructurado (h1, h2, h3, p, listas) y rutas absolutas de imágenes.
  - *Nota:* Se optó por `cheerio` sobre `puppeteer` ya que Microsoft Learn renderiza su contenido de lado del servidor y posee mecanismos de protección severos contra navegadores automatizados (lanzando errores `ERR_ABORTED`).
- **Generador DOCX (`docGenerator.js`)**: Ensambla el contenido utilizando la librería `docx`. Descarga cada imagen detectada como ArrayBuffer, las redimensiona para que quepan en la página, e intercala el texto manteniendo la jerarquía de títulos y viñetas.

## Cómo ejecutar localmente

### Requisitos
- Node.js (v18 o superior recomendado)
- NPM

### Pasos

1. **Iniciar el Backend:**
   Abre una terminal y navega a la carpeta `/backend`:
   ```bash
   cd backend
   npm install
   node server.js
   ```
   El servidor backend correrá en `http://localhost:3001`.

2. **Iniciar el Frontend:**
   Abre otra terminal y navega a la carpeta `/frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   El servidor frontend de desarrollo correrá por defecto en `http://localhost:5173`.

## Limitaciones Conocidas
- **Videos/Interactivos:** La herramienta se limita a extraer texto e imágenes estáticas. Los módulos que dependen en gran medida de contenido de video o laboratorios interactivos no se verán reflejados en el documento de Word.
- **Formato de imagen exacto:** El tamaño de las imágenes incrustadas en el documento de Word tiene un *fallback* estático de dimensiones por motivos de rendimiento; imágenes muy verticales o apaisadas podrían verse deformadas o con diferente escala a la original.
