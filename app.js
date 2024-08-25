const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const os = require('os');

const app = express();
app.use(fileUpload());
app.use(express.static('public'));

// דף הבית שמציג טופס להעלאת קובץ
app.get('/', (req, res) => {
    res.send(`
        <h1>Upload a PDF to Sign</h1>
        <form ref='uploadForm' 
            id='uploadForm' 
            action='/sign-pdf' 
            method='post' 
            encType="multipart/form-data">
            <input type="file" name="pdf" />
            <input type='submit' value='Upload and Sign' />
        </form>     
    `);
});

app.post('/sign-pdf', async (req, res) => {
    console.log("Uploading PDF file...");
    console.log(req.files.pdf); // לוג של הקובץ המתקבל

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const pdfFile = req.files.pdf;
    const pdfDoc = await PDFDocument.load(pdfFile.data);
    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync('./arial.ttf');
    const customFont = await pdfDoc.embedFont(fontBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    firstPage.drawText('חתימה דיגיטלית', {
        x: 50,
        y: height - 100,
        size: 30,
        font: customFont,
        color: rgb(0, 0.53, 0.71),
    });

    const pdfBytes = await pdfDoc.save();

    const downloadsDir = path.join(os.homedir(), 'Downloads');
    const outputPath = path.join(downloadsDir, 'signed_document.pdf');

    fs.writeFileSync(outputPath, pdfBytes);

    res.send(`
        <h2>PDF signed successfully!</h2>
        <p>The signed PDF has been saved to your Downloads folder.</p>
        <a href="/">Go back</a>
    `);
});

app.listen(3000, () => {
    console.log('App listening at http://localhost:3000');
});
