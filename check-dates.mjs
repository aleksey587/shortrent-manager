import fs from 'fs';

async function checkMonth(checkIn, checkOut) {
  const url = `https://www.airbnb.gr/rooms/1685396902544382145?check_in=${checkIn}&check_out=${checkOut}&guests=1&adults=1`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'el-GR,el;q=0.9,en;q=0.8',
      }
    });
    const html = await res.text();
    // Look for price or JSON data
    const priceMatch = html.match(/"price":\s*"([^"]+)"/) || html.match(/(\d+[\.,]?\d*)\s*€/) || html.match(/€\s*(\d+[\.,]?\d*)/);
    const cleaningMatch = html.match(/καθαρισμ[^"]{1,50}/i) || html.match(/cleaning[^"]{1,50}/i);
    return {
      dates: `${checkIn} -> ${checkOut}`,
      price: priceMatch ? priceMatch[0] : 'N/A',
      rawSnippet: html.substring(html.indexOf('totalPrice') - 50, html.indexOf('totalPrice') + 100),
    };
  } catch (err) {
    return { dates: `${checkIn} -> ${checkOut}`, error: err.message };
  }
}

async function run() {
  const months = [
    ['2026-01-14', '2026-01-15'],
    ['2026-02-14', '2026-02-15'],
    ['2026-03-14', '2026-03-15'],
    ['2026-04-14', '2026-04-15'],
    ['2026-05-14', '2026-05-15'],
    ['2026-06-14', '2026-06-15'],
    ['2026-07-14', '2026-07-15'],
    ['2026-08-14', '2026-08-15'],
    ['2026-09-14', '2026-09-15'],
    ['2026-10-14', '2026-10-15'],
    ['2026-11-14', '2026-11-15'],
    ['2026-12-14', '2026-12-15'],
  ];

  for (const [cIn, cOut] of months) {
    const res = await checkMonth(cIn, cOut);
    console.log(res);
  }
}

run();
