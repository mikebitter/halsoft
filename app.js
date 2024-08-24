const express = require('express');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
    res.send(`
        <h1>Upload a PDF to Sign</h1>
        <form method="POST" enctype="multipart/form-data" action="/sign-pdf">
            <input type="file" name="pdf" />
            <button type="submit">Upload and Sign</button>
        </form>
    `);
});

app.post('/sign-pdf', upload.single('pdf'), async (req, res) => {
    try {
        console.log("Uploading PDF file...");
        console.log(req.file);

        // Load the PDF document
        const pdfPath = path.join(__dirname, req.file.path);
        const existingPdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Prepare to sign the first page
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        firstPage.drawText('Signed by Your Name', {
            x: 50,
            y: height - 100,
            size: 30,
            color: rgb(1, 0, 0),
        });

        // Save the signed PDF
        const pdfBytes = await pdfDoc.save();
        const outputPath = path.join(__dirname, 'signed_document.pdf');
        fs.writeFileSync(outputPath, pdfBytes);

        // Remove the original uploaded file
        fs.unlinkSync(pdfPath);

        res.send(`
            <h1>PDF signed successfully!</h1>
            <p><a href="/download-signed-pdf">Download signed PDF</a></p>
        `);
    } catch (err) {
        console.error("Failed to sign the PDF:", err);
        res.status(500).send('Failed to sign the PDF.');
    }
});

app.get('/download-signed-pdf', (req, res) => {
    const filePath = path.join(__dirname, 'signed_document.pdf');
    res.download(filePath);
});

app.listen(3000, () => {
    console.log('App listening at http://localhost:3000');
});
