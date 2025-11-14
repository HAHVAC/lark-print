// pages/api/print.js
import { readFileSync } from 'fs';
import { join } from 'path';
import ejs from 'ejs';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export const config = {
  api: { bodyParser: true, responseLimit: '10mb' }
};

const TEMPLATE_PATH = join(process.cwd(), 'templates', 'invoice.ejs');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const token = process.env.WEBHOOK_TOKEN || '';
  const headerToken = req.headers['x-api-key'] || '';
  if (!token || headerToken !== token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body || {};
    const record = {
      number: payload.record?.number || payload.number || 'PXK-UNKNOWN',
      date: payload.record?.date || new Date().toLocaleString(),
      items: payload.record?.items || payload.items || []
    };

    const template = readFileSync(TEMPLATE_PATH, 'utf8');
    const html = ejs.render(template, { record });

    const executablePath = await chromium.executablePath || process.env.CHROME_PATH || null;
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px' }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=phieu-${record.number}.pdf`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('ERROR /api/print', err);
    return res.status(500).json({ error: 'Failed to generate PDF', message: err.message });
  }
}
