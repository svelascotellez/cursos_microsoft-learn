const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } = docx;

// Función para descargar una imagen a ArrayBuffer (necesario para docx)
async function fetchImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
    } catch (e) {
        console.error(`Error fetching image ${url}:`, e);
        return null;
    }
}

async function generateDocx(courseData) {
    const children = [];

    // Título del curso (placeholder, se podría sacar de la página del módulo)
    children.push(
        new Paragraph({
            text: "Curso de Microsoft Learn",
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
        })
    );

    for (const unit of courseData) {
        // Título de la unidad (URL base)
        children.push(
            new Paragraph({
                text: `Unidad: ${unit.url.split('/').pop()}`,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            })
        );

        for (const item of unit.content) {
            if (item.type === 'h1') {
                children.push(new Paragraph({ text: item.text, heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
            } else if (item.type === 'h2') {
                children.push(new Paragraph({ text: item.text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
            } else if (item.type === 'h3') {
                children.push(new Paragraph({ text: item.text, heading: HeadingLevel.HEADING_3, spacing: { before: 100, after: 100 } }));
            } else if (item.type === 'p') {
                children.push(new Paragraph({ children: [new TextRun(item.text)], spacing: { after: 100 } }));
            } else if (item.type === 'list') {
                for (const li of item.items) {
                    children.push(new Paragraph({ text: li, bullet: { level: 0 } }));
                }
            } else if (item.type === 'image') {
                const imgData = await fetchImage(item.src);
                if (imgData) {
                    children.push(new Paragraph({
                        children: [
                            new ImageRun({
                                data: imgData,
                                transformation: { width: 400, height: 300 }, // Fallback size, real size would be better but requires image parsing
                            })
                        ],
                        spacing: { before: 200, after: 200 },
                        alignment: docx.AlignmentType.CENTER
                    }));
                }
            }
        }
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });

    return await Packer.toBuffer(doc);
}

module.exports = { generateDocx };
