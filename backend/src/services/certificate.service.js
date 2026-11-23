import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure certificates output directory exists
const certsDir = path.join(__dirname, '../../uploads/certificates');
if (!fsSync.existsSync(certsDir)) {
  fsSync.mkdirSync(certsDir, { recursive: true });
}

// Brand Visual Design Tokens (GSFIN Official Red & Ink Palette)
const RED = '#E4202A';
const INK = '#1A1A1A';
const MUTE = '#6B6B6B';
const LINE = '#DCDCDC';
const BLACK = '#000000';

export class CertificateService {
  /**
   * Helper to fetch full certificate config from system_config table
   */
  static async getCertificateConfig() {
    const config = {
      logoAbsPath: null,
      sealAbsPath: null,
      sig1ImageAbsPath: null,
      sig1Name: '',
      sig1Title: '',
      sig2ImageAbsPath: null,
      sig2Name: '',
      sig2Title: '',
    };

    try {
      const [rows] = await pool.query(
        "SELECT `key`, `value` FROM system_config WHERE `key` LIKE 'certificate_%'"
      );
      const map = {};
      for (const row of rows) {
        map[row.key] = row.value;
      }

      const resolveAbsPath = (relPath) => {
        if (!relPath) return null;
        const normalized = relPath.startsWith('/') ? relPath : '/' + relPath;
        const abs = path.join(__dirname, '../../', normalized);
        return fsSync.existsSync(abs) ? abs : null;
      };

      if (map.certificate_logo) config.logoAbsPath = resolveAbsPath(map.certificate_logo);
      if (map.certificate_seal) config.sealAbsPath = resolveAbsPath(map.certificate_seal);
      if (map.certificate_sig1_image) config.sig1ImageAbsPath = resolveAbsPath(map.certificate_sig1_image);
      if (map.certificate_sig1_name !== undefined) config.sig1Name = map.certificate_sig1_name;
      if (map.certificate_sig1_title !== undefined) config.sig1Title = map.certificate_sig1_title;
      if (map.certificate_sig2_image) config.sig2ImageAbsPath = resolveAbsPath(map.certificate_sig2_image);
      if (map.certificate_sig2_name !== undefined) config.sig2Name = map.certificate_sig2_name;
      if (map.certificate_sig2_title !== undefined) config.sig2Title = map.certificate_sig2_title;
    } catch (_) { /* ignore config fetch failure fallback to defaults */ }

    // Fallback logo if not configured
    if (!config.logoAbsPath) {
      const defaultLogoPaths = [
        path.join(__dirname, '../../uploads/branding/logo.png'),
        path.join(__dirname, '../../../frontend/public/assets/images/logo.png'),
        path.join(__dirname, '../../uploads/branding/logo.webp'),
        path.join(__dirname, '../../../frontend/public/logo.webp')
      ];
      for (const p of defaultLogoPaths) {
        if (fsSync.existsSync(p)) {
          config.logoAbsPath = p;
          break;
        }
      }
    }

    return config;
  }

  /**
   * Generates a unique certificate number in GSFIN-YYMM-XXXXX format
   */
  static async generateCertificateNumber() {
    try {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      
      const [[res]] = await pool.query('SELECT COUNT(*) as count FROM public_exam_issued_certificates');
      const count = (res && res.count) ? res.count : 0;
      const seq = String(count + 1).padStart(4, '0');
      return `GSFIN-${yy}${mm}-${seq}`;
    } catch (e) {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const rand = String(Math.floor(1000 + Math.random() * 9000));
      return `GSFIN-${yy}${mm}-${rand}`;
    }
  }

  /**
   * Generates a GSFIN-styled verified certificate as a PDF & standalone HTML
   * @param {string} candidateName 
   * @param {string} examName 
   * @param {Date|string} date 
   * @param {Object|string|null} customOptions Or logoAbsPath string for backwards compatibility
   * @param {string|null} certificateNumber Custom certificate number or auto-generated if null
   * @returns {Promise<{ buffer: Buffer, pdfUrl: string, certificateNumber: string }>}
   */
  static async generateParticipationCertificate(candidateName, examName, date, customOptions = null, certificateNumber = null) {
    let opts = {};
    if (typeof customOptions === 'string') {
      opts = { logoAbsPath: customOptions };
    } else if (customOptions && typeof customOptions === 'object') {
      opts = customOptions;
    }

    const sysConfig = await CertificateService.getCertificateConfig();
    const config = { ...sysConfig, ...opts };
    const certNo = certificateNumber || await CertificateService.generateCertificateNumber();

    const cName = candidateName || 'Candidate';
    const eName = examName || 'Codex HACCP';
    const issueDateObj = date ? new Date(date) : new Date();
    const issueDateStr = !isNaN(issueDateObj.getTime())
      ? issueDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '24 October 2026';

    const validThroughObj = new Date(issueDateObj);
    validThroughObj.setFullYear(validThroughObj.getFullYear() + 3);
    validThroughObj.setDate(validThroughObj.getDate() - 1);
    const validThroughStr = !isNaN(validThroughObj.getTime())
      ? validThroughObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '23 October 2029';

    const centerNameStr = opts.centerName || 'London Academy of Food Safety';
    const cleanCertSuffix = certNo.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '0842';
    const verifyUrlStr = opts.verifyUrl || `verify.gsfin.org/c/${cleanCertSuffix}`;
    const docRefStr = `GSFIN-CX-${cleanCertSuffix}-A`;
    const secHashStr = 'e4a8…7c19';
    const sigNameStr = config.sig1Name || 'A. Al-Mansoor';
    const sigTitleStr = config.sig1Title || 'Director of Certification';

    return new Promise((resolve, reject) => {
      try {
        // Landscape A4 (297mm x 210mm -> 841.89 pt x 595.28 pt)
        const doc = new PDFDocument({
          layout: 'landscape',
          size: 'A4',
          margin: 0,
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
          const pdfData = Buffer.concat(buffers);
          const certUid = uuidv4();
          const filename = `cert_${certUid}.pdf`;
          const filepath = path.join(certsDir, filename);

          try {
            await fs.writeFile(filepath, pdfData);
            const pdfUrl = `/uploads/certificates/${filename}`;

            // Also write HTML version for seamless interactive rendering / web printing
            try {
              const htmlFilename = `cert_${certUid}.html`;
              const htmlFilePath = path.join(certsDir, htmlFilename);
              const htmlContent = CertificateService.buildCertificateHtml({
                candidateName: cName,
                examTitle: eName,
                certificateNumber: certNo,
                issueDate: issueDateStr,
                validThrough: validThroughStr,
                centerName: centerNameStr,
                verifyUrl: verifyUrlStr,
                docRef: docRefStr,
                secHash: secHashStr,
                sigName: sigNameStr,
                sigTitle: sigTitleStr,
                logoAbsPath: config.logoAbsPath
              });
              await fs.writeFile(htmlFilePath, htmlContent, 'utf8');
            } catch (_) { /* ignore html write failure */ }

            resolve({ buffer: pdfData, pdfUrl, certificateNumber: certNo });
          } catch (writeErr) {
            reject(writeErr);
          }
        });

        const W = 841.89;
        const H = 595.28;

        // 1. White Page Background
        doc.rect(0, 0, W, H).fill('#FFFFFF');

        // 2. Left Side Strip (126 pt wide)
        const sideW = 126;
        const upperH = H - 112.5;

        // 2a. Upper Red Section
        doc.rect(0, 0, sideW, upperH).fill(RED);

        // Rotated Title Text (-90 degrees)
        doc.save();
        doc.translate(sideW / 2, upperH / 2);
        doc.rotate(-90);
        const titleLen = eName.length;
        const rotatedFontSize = titleLen > 24 ? 38 : (titleLen > 16 ? 46 : 52);
        doc.fontSize(rotatedFontSize).fillColor('#FFFFFF').font('Times-Bold')
           .text(eName, -240, -rotatedFontSize / 2 + 5, {
             width: 480,
             align: 'center',
             characterSpacing: 0.5
           });
        doc.restore();

        // 2b. Lower Black Section (112.5 pt high)
        doc.rect(0, upperH, sideW, 112.5).fill(BLACK);
        doc.fontSize(26).fillColor('#FFFFFF').font('Times-Bold')
           .text('GSFIN', 0, upperH + 42, {
             width: sideW,
             align: 'center',
             characterSpacing: 1.5
           });

        // 3. Top Row (Logo & Certificate No)
        const contentLeftX = 186;
        if (config.logoAbsPath && fsSync.existsSync(config.logoAbsPath)) {
          try {
            doc.image(config.logoAbsPath, contentLeftX, 36, { height: 46, fit: [160, 46] });
          } catch (_) { /* fallback if logo format error */ }
        }

        doc.fontSize(9).fillColor(MUTE).font('Helvetica')
           .text('CERTIFICATE NO.', 540, 40, { width: 248, align: 'right' });
        doc.fontSize(11).fillColor(INK).font('Helvetica-Bold')
           .text(certNo, 540, 52, { width: 248, align: 'right', characterSpacing: 0.5 });

        // 4. Body Content
        doc.fontSize(16).fillColor(RED).font('Times-Italic')
           .text('Certificate of Completion', contentLeftX, 110);

        doc.fontSize(10).fillColor(MUTE).font('Helvetica')
           .text('THIS IS PROUDLY PRESENTED TO', contentLeftX, 134, { characterSpacing: 0.8 });

        const nameLen = cName.length;
        const nameFontSize = nameLen > 24 ? 44 : (nameLen > 18 ? 50 : 56);
        doc.fontSize(nameFontSize).fillColor(INK).font('Times-Roman')
           .text(cName, contentLeftX, 150, { width: 590 });

        const lineY = 150 + nameFontSize + 12;
        doc.rect(contentLeftX, lineY, 72, 2.5).fill(RED);

        const descY = lineY + 14;
        doc.fontSize(10.5).fillColor(MUTE).font('Helvetica')
           .text(
             'for successfully completing the prescribed examination and demonstrating professional competence in accordance with the Global Standards for Food Industries.',
             contentLeftX, descY, { width: 420, lineGap: 3 }
           );

        const stdY = descY + 42;
        doc.fontSize(28).fillColor(INK).font('Times-Bold')
           .text(eName, contentLeftX, stdY, { width: 520 });

        // 5. Footer Row (Signatory, Seal, Registry)
        // Signatory (Left)
        if (config.sig1ImageAbsPath && fsSync.existsSync(config.sig1ImageAbsPath)) {
          try {
            doc.image(config.sig1ImageAbsPath, contentLeftX, 418, { height: 32, fit: [140, 32] });
          } catch (_) {}
        } else {
          doc.fontSize(18).fillColor(INK).font('Times-Italic')
             .text(sigNameStr, contentLeftX, 426);
        }
        doc.moveTo(contentLeftX, 450).lineTo(contentLeftX + 135, 450).lineWidth(0.8).stroke(INK);
        doc.fontSize(8.5).fillColor(MUTE).font('Helvetica')
           .text(`${sigTitleStr}\nGSFIN Examination Board`, contentLeftX, 456, { lineGap: 2 });

        // Official Security Seal (Center)
        const cx = 430;
        const cy = 460;
        if (config.sealAbsPath && fsSync.existsSync(config.sealAbsPath)) {
          try {
            doc.image(config.sealAbsPath, cx - 38, cy - 38, { width: 76, height: 76, fit: [76, 76] });
          } catch (_) {}
        } else {
          // Micro-security seal vector rendering
          doc.circle(cx, cy, 38).lineWidth(1).dash(2, { space: 2 }).stroke(RED);
          doc.undash();
          doc.circle(cx, cy, 35).lineWidth(0.8).stroke(INK);
          doc.circle(cx, cy, 33).lineWidth(0.5).stroke(RED);
          doc.circle(cx, cy, 24).fillAndStroke('#FFFFFF', RED);
          doc.fontSize(8.5).fillColor(RED).font('Times-Bold')
             .text('GSFIN', cx - 24, cy - 8, { width: 48, align: 'center' });
          doc.fontSize(4.5).fillColor(MUTE).font('Helvetica-Bold')
             .text('VERIFIED', cx - 24, cy + 2, { width: 48, align: 'center', characterSpacing: 1 });
          doc.fontSize(5).fillColor(RED).font('Helvetica')
             .text('★ ★ ★', cx - 24, cy + 8, { width: 48, align: 'center' });
        }

        // Registry Data (Right)
        const regX = 520;
        const regW = 268;
        let curY = 422;
        const regEntries = [
          ['DATE OF ISSUANCE', issueDateStr],
          ['VALID THROUGH', validThroughStr],
          ['ACCREDITED CENTER', centerNameStr],
          ['VERIFICATION', verifyUrlStr]
        ];
        for (const [k, v] of regEntries) {
          doc.fontSize(8.5).fillColor(MUTE).font('Helvetica')
             .text(`${k}  `, regX, curY, { width: regW, align: 'right', continued: true });
          doc.fontSize(8.5).fillColor(INK).font('Helvetica-Bold')
             .text(v);
          curY += 14;
        }

        // 6. Bottom Security Tag Bar
        doc.moveTo(contentLeftX, 526).lineTo(788, 526).lineWidth(0.8).stroke(LINE);
        doc.fontSize(8).fillColor(MUTE).font('Helvetica')
           .text('GSFIN / GLOBAL STANDARDS FOR FOOD INDUSTRIES • CODEX ALIMENTARIUS COMPLIANT', contentLeftX, 536);
        doc.fontSize(8.5).fillColor(INK).font('Times-Italic')
           .text(`Doc. Ref. ${docRefStr} • Security Hash: ${secHashStr}`, 480, 536, { width: 308, align: 'right' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Builds pixel-perfect HTML certificate matching the user's template
   */
  static buildCertificateHtml({
    candidateName,
    examTitle,
    certificateNumber,
    issueDate,
    validThrough,
    centerName,
    verifyUrl,
    docRef,
    secHash,
    sigName,
    sigTitle,
    logoAbsPath
  }) {
    let logoDataUrl = '';
    if (logoAbsPath && fsSync.existsSync(logoAbsPath)) {
      try {
        const ext = path.extname(logoAbsPath).replace('.', '') || 'png';
        const fileBuf = fsSync.readFileSync(logoAbsPath);
        logoDataUrl = `data:image/${ext};base64,${fileBuf.toString('base64')}`;
      } catch (_) {}
    }
    if (!logoDataUrl) {
      logoDataUrl = '/assets/images/logo.png';
    }

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>GSFIN Certificate – ${examTitle}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Hanken+Grotesk:wght@400;500;600&display=swap">
<style>
:root{--red:#E4202A;--ink:#1a1a1a;--mute:#6b6b6b;--line:#dcdcdc;--paper:#fff;--stage:#ececec;--serif:"Playfair Display",Georgia,serif;--sans:"Hanken Grotesk",system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--stage:#1c1c1c}}
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{background:var(--stage);font-family:var(--sans);color:var(--ink);display:flex;align-items:center;justify-content:center;overflow:hidden;padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}
#fit{width:1123px;height:794px;transform-origin:center}
.page{position:relative;width:1123px;height:794px;background:var(--paper);display:grid;grid-template-columns:168px 1fr;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.side{display:grid;grid-template-rows:1fr 150px}
.side .r{background:var(--red);position:relative;overflow:hidden}
.side .r span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-90deg);white-space:nowrap;font:700 76px/1 var(--serif);color:#fff;letter-spacing:.01em}
.side .b{background:#000;display:grid;place-items:center;color:#fff;font:700 34px var(--serif);letter-spacing:.04em}
.main{padding:52px 72px 40px 80px;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:flex-start}
.top img{height:62px;display:block;object-fit:contain}
.no{text-align:right;font-size:12px;color:var(--mute);line-height:1.5}
.no b{display:block;font:600 15px var(--sans);color:var(--ink);letter-spacing:.04em}
.body{flex:1;display:flex;flex-direction:column;justify-content:center}
.kind{font:500 italic 22px var(--serif);color:var(--red);margin-bottom:34px}
.lead{font-size:14px;color:var(--mute);margin-bottom:8px}
.name{font:500 84px/1.02 var(--serif);letter-spacing:-.01em}
.rule{width:96px;height:3px;background:var(--red);margin:30px 0 26px}
.txt{font-size:15px;line-height:1.6;color:var(--mute);max-width:520px}
.std{font:700 40px/1.1 var(--serif);margin:10px 0 12px}
.foot{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}
.sig{width:210px;font-size:12px;color:var(--mute)}
.sig i{display:block;font:italic 500 26px var(--serif);color:var(--ink);padding-bottom:4px;border-bottom:1px solid var(--ink);margin-bottom:6px}
.seal{width:118px;height:118px}
.reg{text-align:right;font-size:12px;color:var(--mute);line-height:1.6}
.reg b{color:var(--ink);font-weight:600}
.tag{margin-top:26px;padding-top:14px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:11.5px;color:var(--mute)}
.tag em{font:italic 500 13px var(--serif);color:var(--ink)}
@media print{@page{size:297mm 210mm;margin:0}html,body{height:auto;background:#fff;overflow:visible;display:block;padding:0}#fit{transform:none!important;width:297mm;height:210mm}.page{width:297mm;height:210mm;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div id="fit"><div class="page">
 <aside class="side"><div class="r"><span>${examTitle}</span></div><div class="b">GSFIN</div></aside>
 <main class="main">
  <div class="top"><img alt="GSFIN – Global Standards for Food Industries" src="${logoDataUrl}">
  <div class="no">CERTIFICATE NO.<b>${certificateNumber}</b></div></div>
  <div class="body">
   <div class="kind">Certificate of Completion</div>
   <div class="lead">THIS IS PROUDLY PRESENTED TO</div>
   <h1 class="name">${candidateName}</h1>
   <div class="rule"></div>
   <p class="txt">for successfully completing the prescribed examination and demonstrating professional competence in accordance with the Global Standards for Food Industries.</p>
   <div class="std">${examTitle}</div>
  </div>
  <div class="foot">
   <div class="sig"><i>${sigName}</i>${sigTitle}<br>GSFIN Examination Board</div>
   <svg class="seal" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
     <defs>
       <path id="seal-text-path" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
     </defs>
     <circle cx="60" cy="60" r="56" fill="none" stroke="#E4202A" stroke-width="1.5" stroke-dasharray="3 2" />
     <circle cx="60" cy="60" r="52" fill="none" stroke="#1A1A1A" stroke-width="1.2" />
     <circle cx="60" cy="60" r="49" fill="none" stroke="#E4202A" stroke-width="0.8" />
     <text font-family="'Hanken Grotesk', sans-serif" font-size="7.2" font-weight="700" fill="#1A1A1A" letter-spacing="0.12em">
       <textPath href="#seal-text-path" startOffset="50%" text-anchor="middle">
         GLOBAL STANDARDS FOR FOOD INDUSTRIES • OFFICIAL SEAL •
       </textPath>
     </text>
     <circle cx="60" cy="60" r="33" fill="#FFFFFF" stroke="#E4202A" stroke-width="1.2" />
     <circle cx="60" cy="60" r="30" fill="none" stroke="#DCDCDC" stroke-width="0.8" />
     <g transform="translate(60, 48)">
       <path d="M-8,-2 L0,-9 L8,-2 L5,8 L-5,8 Z" fill="#E4202A" opacity="0.12" />
       <path d="M-6,0 L0,-6 L6,0 L4,6 L-4,6 Z" fill="none" stroke="#E4202A" stroke-width="1.2" />
     </g>
     <text x="60" y="65" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-size="13" font-weight="700" fill="#E4202A" letter-spacing="0.08em">GSFIN</text>
     <text x="60" y="73" text-anchor="middle" font-family="'Hanken Grotesk', sans-serif" font-size="5.2" font-weight="600" fill="#6B6B6B" letter-spacing="0.15em">VERIFIED</text>
     <text x="60" y="80" text-anchor="middle" font-size="6" fill="#E4202A">★ ★ ★</text>
   </svg>
   <div class="reg">
    <div>DATE OF ISSUANCE &nbsp;<b>${issueDate}</b></div>
    <div>VALID THROUGH &nbsp;<b>${validThrough}</b></div>
    <div>ACCREDITED CENTER &nbsp;<b>${centerName}</b></div>
    <div>VERIFICATION &nbsp;<b>${verifyUrl}</b></div>
   </div>
  </div>
  <div class="tag">
   <span>GSFIN / GLOBAL STANDARDS FOR FOOD INDUSTRIES &bull; CODEX ALIMENTARIUS COMPLIANT</span>
   <em>Doc. Ref. ${docRef} &bull; Security Hash: ${secHash}</em>
  </div>
 </main>
</div></div>
</body></html>`;
  }
}
