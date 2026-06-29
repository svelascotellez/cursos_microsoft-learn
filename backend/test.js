const cheerio = require('cheerio');

async function test() {
    const html = await fetch('https://learn.microsoft.com/es-es/training/modules/introduction-to-github/2-what-is-github').then(r => r.text());
    const $ = cheerio.load(html);
    const imgs = [];
    $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src) imgs.push(src);
    });
    
    console.log("Imágenes encontradas:", imgs);
}

test();
