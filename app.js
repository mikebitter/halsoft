const express = require('express');
const multer = require('multer');
const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve the form HTML at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/sign-pdf', upload.single('pdf'), async (req, res) => {
    try {
        console.log('Uploading PDF file...');
        const pdfPath = path.join(__dirname, req.file.path);
        const existingPdfBytes = fs.readFileSync(pdfPath);
        console.log('PDF file uploaded successfully, loading PDF document...');

        // Load a PDFDocument from the existing PDF bytes with ignoreEncryption option
        const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
        console.log('PDF document loaded successfully, preparing to sign...');

        // Add a new page to the PDF
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Draw a string of text diagonally across the first page
        firstPage.drawText('Signed by My App', {
            x: width / 2 - 100,
            y: height / 2,
            size: 50,
            color: rgb(0, 0, 0), // Using rgb function from pdf-lib
            rotate: degrees(45), // Correct usage of rotation in degrees
        });
        console.log('Text added to PDF, saving...');

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save();
        console.log('PDF saved successfully.');

        // Save the signed PDF
        const outputPath = path.join(__dirname, 'signed_output.pdf');
        fs.writeFileSync(outputPath, pdfBytes);

        // Send the signed PDF to the client
        res.download(outputPath, 'signed_output.pdf', (err) => {
            if (err) {
                console.error('Failed to send signed PDF:', err);
                res.status(500).send('Failed to send signed PDF.');
            }
        });

    } catch (err) {
        console.error('Failed to sign the PDF:', err);
        res.status(500).send('Failed to sign the PDF.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
});
