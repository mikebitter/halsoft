const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// הגדרת Multer לניהול העלאת קבצים
const upload = multer({ dest: 'uploads/' });

// הגשת קובץ ה-HTML לדפדפן
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/sign-pdf', upload.single('pdf'), async (req, res) => {
    try {
        const pdfPath = req.file.path;
        const pdfBytes = fs.readFileSync(pdfPath);

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        firstPage.drawText('Signed by Mikes App', {
            x: 50,
            y: 50,
            size: 20,
        });

        const signedPdfBytes = await pdfDoc.save();

        fs.unlinkSync(pdfPath);

        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(signedPdfBytes));

    } catch (err) {
        console.error('Error signing PDF:', err);
        res.status(500).send('Error signing PDF');
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
