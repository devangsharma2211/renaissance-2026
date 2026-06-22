import FestivalPass from '../../models/FestivalPass.js';
import qrcode from 'qrcode';
import { createCanvas, Image, registerFont } from 'canvas';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import awssendEmail from '../awsSendEmail.js'; 
import Student from '../../models/student.js';
import enqueueEmail from '../emailQueue.js';

// ES Module __dirname Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONSTANTS (PRINT SAFE)
const WIDTH = 5880;
const HEIGHT = 2209;

// Helper to generate QR Buffer
export async function generateQRCode(data) {
    return await qrcode.toBuffer(data, {
        type: 'png',
        errorCorrectionLevel: 'H', 
        color: {
            dark: '#000000',      
            light: '#00000000'    
        }
    });
}


// MAIN FUNCTION
async function bookTicket(
    studentId,
    studentName,
    studentYear,
    studentBranch,
    studentEmail,
    password
) {
    return enqueueEmail(async () => {
        try {
            const student = await Student.findById(studentId);

            if (student.passSent) {
            console.log("ℹ Master pass already sent, skipping");
            return;
            }

        // Check/Create Pass
        let pass = await FestivalPass.findOne({ student: studentId });
            if (!pass) {
            pass = new FestivalPass({ student: studentId });
            await pass.save();
            }

        //Generate QR Code
        const qrPayload = JSON.stringify({
            passId: pass.id,
            studentId,
            name: studentName,
            branch: studentBranch,
            year: studentYear
        });

        const qrBuffer = await generateQRCode(qrPayload);

        // Paths
        const ticketPath = path.join(__dirname, '../../images/ren2026masterpass.png');
        const fontPath1 = path.join(__dirname, '../../fonts/Merienda/Merienda-regular.ttf');
        const fontPath2 = path.join(__dirname, '../../fonts/Bebas_Neue/BebasNeue-Regular.ttf');

        await fs.access(ticketPath);
        await fs.access(fontPath1);
        await fs.access(fontPath2);

        //Register Font
        registerFont(fontPath1, { family: 'Merienda' });
        registerFont(fontPath2, { family: 'Bebas Neue' });

        // Load Background
        const bgBuffer = await fs.readFile(ticketPath);
        const bgImage = new Image();
        bgImage.src = bgBuffer;

        // Create Canvas (FIXED SIZE)
        const canvas = createCanvas(WIDTH, HEIGHT);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);


        // QR ZONE (LEFT)
        const qrSize = 1600;
        const qrX = 338;
        const qrY = (HEIGHT - qrSize) / 2;

        const resizedQr = await sharp(qrBuffer)
            .resize(qrSize, qrSize)
            .toBuffer();

        const qrImage = new Image();
        qrImage.src = resizedQr;
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        // TEXT ZONE (RIGHT) with auto-fit fonts
        const textX = 2660;
        let textY = 1000;

        ctx.fillStyle = "#223041";
        ctx.textAlign = 'left';

        // Helper: reduce font size until text fits within maxWidth
        const fitFontSize = (text, fontFamily, maxWidth, maxSize = 180, minSize = 40, step = 2) => {
            let size = maxSize;
            ctx.font = `${size}px ${fontFamily}`;
            // Reduce until fits or minSize reached
            while (ctx.measureText(text).width > maxWidth && size > minSize) {
            size -= step;
            ctx.font = `${size}px ${fontFamily}`;
            }
            return size;
        };

        const rightMargin = 380; // leave safe margin from right edge
        const maxTextWidth = WIDTH - textX - rightMargin;

        // Name (auto-fit)
        const nameText = `NAME: ${studentName.toUpperCase()}`;
        const nameFont = 'Bebas Neue';
        const nameSize = fitFontSize(nameText, nameFont, maxTextWidth, 180, 60, 2);
        ctx.font = `${nameSize}px ${nameFont}`;
        ctx.fillText(nameText, textX, textY);

        textY += Math.round(nameSize * 1.2) + 10; // vertical spacing based on font size

        // Year (smaller, but fit if necessary)
        const yearText = `YEAR: ${studentYear}`;
        const yearFont = 'Bebas Neue';
        const yearSize = fitFontSize(yearText, yearFont, maxTextWidth, 150, 40, 2);
        ctx.font = `${yearSize}px ${yearFont}`;
        ctx.fillText(yearText, textX, textY);

        textY += Math.round(yearSize * 1.2) + 8;

        // Branch (auto-fit and uppercase)
        const branchText = `BRANCH: ${String(studentBranch || '').toUpperCase()}`;
        const branchFont = 'Bebas Neue';
        const branchSize = fitFontSize(branchText, branchFont, maxTextWidth, 150, 40, 2);
        ctx.font = `${branchSize}px ${branchFont}`;
        ctx.fillText(branchText, textX, textY);

        // Final Buffer
        const finalBuffer = canvas.toBuffer('image/png');

        //EMAIL
        const emailSubject = 'Renaissance — Festival Pass & Login';

        const emailBody = `
        <div style="font-family: Arial; padding:20px">
            <p>Hi ${studentName},</p>

            <p>Thanks for signing up for JECRC’s National Techno-Cultural Fest — <strong>Renaissance 2026</strong> 🎉</p>
            <p>You’re officially on the list, and trust us—you don’t want to miss this.</p>

            <p>The official fest website is live — visit <a href="https://jecrcrenaissance.co.in">jecrcrenaissance.co.in</a></p>

            <p>Log in using:<br/>
            <b>Email ID:</b> ${studentEmail}<br/>
            <b>Password:</b> ${password}
            </p>

            <p>Got questions or need help? Just hit us up — we’re here at our insta handle @jecrcrenaissance.</p>

            <p>Get ready to vibe, build, and celebrate ✨<br/>See you at Renaissance 2026!</p>

            <p>Renaissance,<br/>JECRC</p>
        </div>
        `;

        const attachments = [
            {
                filename: 'RenaissancePass.png',
                content: finalBuffer
            }
        ];

        await awssendEmail(studentEmail, emailSubject, emailBody, attachments);

        console.log(`✅ Ticket generated & emailed to ${studentEmail}`);

        student.passSent=true;
        await student.save();

    } catch (err) {
        console.error('❌ bookTicket error:', err);
        throw err;
    }
    });
}

export default bookTicket;
