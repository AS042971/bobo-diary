import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import serveIndex from 'serve-index';
let port = 5927; // 填写端口号

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', serveIndex('static', {icons: true}));
app.use('/static', express.static('static'));

app.post("/api/composition", async (request, response) => {
  const { content, block, column, row, lineStr, pdf } = request.body;
  const now = new Date();
  try {
    JSON.parse(lineStr);
  } catch {
    response.status(400);
    return;
  }

  if (isNaN(parseInt(block)) || isNaN(parseInt(column)) || isNaN(parseInt(row))) {
    response.status(400);
    return;
  }

  fs.writeFileSync(path.resolve(__dirname, '../html', 'config.js'), 
  `const block = ${block};const column = ${column};const row = ${row};const text = "${content.replace(/\n/g, "\\n")}";const line = ${lineStr};`);
  fs.writeFileSync(path.resolve(__dirname, "../static", "txt", `${now.getTime()}.txt`), content);

  if (pdf !== undefined) {
    // 输出为 pdf
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        width: (26 * parseInt(block) + 17) * parseInt(column) + 5,
        height: 31 * parseInt(row) + 7
      }
    });
    const page = await browser.newPage();
    await page.goto(path.resolve(__dirname, '../html', 'com.html'));
    await page.waitForTimeout(800);
    await page.pdf({ path: path.resolve(__dirname, "../static", "pdf", `${now.getTime()}.pdf`), 
      format: 'a4', 
      printBackground: true, 
      preferCSSPageSize: false,
      margin: {top: '10mm', left: '10mm', right: '10mm', bottom: '10mm'},
      landscape: true
    });
    browser.close();
    response.send(`https://server.pyusr.com/static/pdf/${now.getTime()}.pdf`);
  } else {
    // 输出为 png 图片
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        width: (26 * parseInt(block) + 17) * parseInt(column) + 5,
        height: 31 * parseInt(row) + 7
      }
    });
    const page = await browser.newPage();
    await page.goto(path.resolve(__dirname, '../html', 'com.html'));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.resolve(__dirname, "../static", "img", `${now.getTime()}.png`) });
    browser.close();
    response.send(`https://server.pyusr.com/static/img/${now.getTime()}.png`);
  }

  console.log(`在 ${now.constructor()}，一篇新作文已存储`);
});

app.listen(port, () => {
  console.log(`Application has started on Port ${port}`);
});
