const express = require('express');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/sign-pdf', upload.single('pdf'), async (req, res) => {
    console.log("Uploading PDF file...");
    console.log(req.file); // לוג של הקובץ המתקבל

    try {
        const pdfDoc = await PDFDocument.load(req.file.buffer);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // הוספת טקסט לחתימה
        firstPage.drawText('Signed by Your Name', {
            x: 50,
            y: 700,
            size: 30,
            color: rgb(0, 0, 0),
        });

        // שמירת הקובץ החתום
        const pdfBytes = await pdfDoc.save();

        res.contentType("application/pdf");
        res.send(pdfBytes);
    } catch (err) {
        console.error("Failed to sign the PDF:", err);
        res.status(500).send("Failed to sign the PDF.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
});
