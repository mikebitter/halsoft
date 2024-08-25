const express = require('express');
const fileUpload = require('express-fileupload');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const fontkit = require('@pdf-lib/fontkit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(fileUpload());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/sign-pdf', async (req, res) => {
    try {
        if (!req.files || !req.files.pdf) {
            return res.status(400).send('No PDF file uploaded.');
        }

        console.log("Uploading PDF file...");
        console.log(req.files.pdf); // לוג של הקובץ המתקבל

        const pdfBuffer = req.files.pdf.data;
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        pdfDoc.registerFontkit(fontkit);

        const fontBytes = fs.readFileSync(path.join(__dirname, 'arial.ttf'));
        const customFont = await pdfDoc.embedFont(fontBytes);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        firstPage.drawText('חתימה בעברית', {
            x: 50,
            y: 50,
            size: 30,
            font: customFont,
            color: rgb(0, 0, 0)
        });

        const pdfBytes = await pdfDoc.save();

        const outputPath = path.join(__dirname, 'signed_document.pdf');
        fs.writeFileSync(outputPath, pdfBytes);

        res.download(outputPath, 'signed_document.pdf', (err) => {
            if (err) {
                console.error("Failed to download the signed PDF.", err);
                res.status(500).send("Failed to download the signed PDF.");
            }
        });
    } catch (error) {
        console.error("Failed to sign the PDF:", error);
        res.status(500).send("Failed to sign the PDF.");
    }
});

app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
});
