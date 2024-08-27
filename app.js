const express = require('express');
const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const multer = require('multer');
const path = require('path');

const app = express();

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/sign-pdf', upload.single('pdf'), async (req, res) => {
    try {
        console.log('Received request to sign PDF');

        let graphicSignature = req.body.signature;
        let signatureX = parseFloat(req.body.signatureX);
        let signatureY = parseFloat(req.body.signatureY);

        const pdfBytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        pdfDoc.registerFontkit(fontkit);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        const pageWidth = firstPage.getWidth();
        const pageHeight = firstPage.getHeight();

        console.log('Page width:', pageWidth);
        console.log('Page height:', pageHeight);
        console.log('Original Signature X:', signatureX);
        console.log('Original Signature Y:', signatureY);

        // Convert coordinates to match the PDF's dimensions
        const canvasWidth = parseFloat(req.body.canvasWidth);
        const canvasHeight = parseFloat(req.body.canvasHeight);

        // המרה נכונה של קואורדינטות ה-X וה-Y
        signatureX = (signatureX / canvasWidth) * pageWidth;
        signatureY = ((canvasHeight - signatureY) / canvasHeight) * pageHeight;

        // הזזת החתימה שמאלה ולמעלה
        const xOffset = -110;  // להזיז 110 פיקסלים שמאלה
        const yOffset = 20;    // להזיז 20 פיקסלים למעלה
        signatureX += xOffset;
        signatureY += yOffset;

        console.log('Adjusted Signature X:', signatureX);
        console.log('Adjusted Signature Y:', signatureY);

        if (graphicSignature) {
            console.log('Graphic signature provided');
            try {
                const pngImageBytes = Buffer.from(graphicSignature.split(',')[1], 'base64');
                const pngImage = await pdfDoc.embedPng(pngImageBytes);
                console.log('Signature image embedded successfully.');

                firstPage.drawImage(pngImage, {
                    x: signatureX,
                    y: signatureY,
                    width: 100,
                    height: 50,
                });
                console.log('Signature image drawn on the PDF.');
            } catch (error) {
                console.error('Error embedding signature image:', error);
                res.status(500).send('Error embedding signature image.');
                return;
            }
        } else {
            res.status(400).send('No valid signature provided.');
            return;
        }

        const signedPdfBytes = await pdfDoc.save();
        const outputPath = path.join(__dirname, 'downloads', `signed-${req.file.originalname}`);
        fs.writeFileSync(outputPath, signedPdfBytes);
        console.log('Signed PDF saved to:', outputPath);

        res.download(outputPath, err => {
            if (err) {
                res.status(500).send('Error sending file');
            } else {
                console.log('File sent successfully');
            }

            fs.unlinkSync(req.file.path);
            fs.unlinkSync(outputPath);
        });
    } catch (error) {
        console.error('Error signing PDF:', error);
        res.status(500).send('Error signing PDF');
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
