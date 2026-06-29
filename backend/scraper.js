const cheerio = require('cheerio');

async function fetchHtml(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
}

async function scrapeModule(url) {
    console.log(`Descargando HTML de: ${url}`);
    
    let html;
    try {
        html = await fetchHtml(url);
    } catch (e) {
        console.error(`Error al obtener ${url}: ${e.message}`);
        return [];
    }

    const $ = cheerio.load(html);
    
    // Find all links to units in the module
    const unitLinks = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        // Unidades suelen tener un número al inicio seguido de guión, e.g. "1-introduction"
        // O ser rutas completas como "/es-es/training/modules/introduction-to-github/1-introduction"
        if (href && (href.match(/^\d+-/) || href.match(/\/modules\/[^\/]+\/\d+-/))) {
            const absoluteUrl = new URL(href, url).href;
            if (!unitLinks.includes(absoluteUrl)) {
                unitLinks.push(absoluteUrl);
            }
        }
    });

    if (unitLinks.length === 0) {
        unitLinks.push(url);
    }
    
    console.log(`Encontradas ${unitLinks.length} unidades.`);
    
    const unitsData = [];
    
    for (const link of unitLinks) {
        console.log(`Scraping unidad: ${link}`);
        try {
            const unitHtml = await fetchHtml(link);
            const $unit = cheerio.load(unitHtml);
            
            const mainContent = $unit('main').length ? $unit('main') : $unit('body');
            const contentList = [];
            
            mainContent.find('h1, h2, h3, h4, p, img, ul, ol').each((i, el) => {
                const tagName = el.tagName.toLowerCase();
                if (tagName === 'img') {
                    const src = $unit(el).attr('src');
                    if (src && !src.includes('data:image')) {
                        const absoluteSrc = new URL(src, link).href;
                        contentList.push({ type: 'image', src: absoluteSrc });
                    }
                } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
                    const text = $unit(el).text().trim();
                    if (text) contentList.push({ type: tagName, text: text });
                } else if (tagName === 'p') {
                    const text = $unit(el).text().trim();
                    if (text) contentList.push({ type: 'p', text: text });
                } else if (tagName === 'ul' || tagName === 'ol') {
                    const items = [];
                    $unit(el).find('li').each((j, li) => {
                        const text = $unit(li).text().trim();
                        if (text) items.push(text);
                    });
                    if (items.length > 0) contentList.push({ type: 'list', items: items });
                }
            });
            
            unitsData.push({ url: link, content: contentList });
        } catch (e) {
            console.error(`Error al procesar unidad ${link}: ${e.message}`);
        }
    }
    
    return unitsData;
}

module.exports = { scrapeModule };
