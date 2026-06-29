const express = require('express');
const cors = require('cors');
const { scrapeModule } = require('./scraper');
const { generateDocx } = require('./docGenerator');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.startsWith('https://learn.microsoft.com/')) {
        return res.status(400).json({ error: 'URL inválida de Microsoft Learn' });
    }

    try {
        console.log(`Iniciando descarga para: ${url}`);
        
        // 1. Scrapear el contenido
        const courseData = await scrapeModule(url);
        
        if (!courseData || courseData.length === 0) {
            return res.status(404).json({ error: 'No se pudo extraer contenido del curso.' });
        }

        console.log('Scraping completado. Generando documento Word...');

        // 2. Generar el documento docx
        const buffer = await generateDocx(courseData);

        console.log('Documento generado.');

        // 3. Enviar el archivo al cliente
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename="microsoft-learn-course.docx"');
        res.send(buffer);
    } catch (error) {
        console.error('Error durante el proceso:', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
