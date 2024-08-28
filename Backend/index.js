// backend/server.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve files in uploads directory

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Save file with original name initially
  },
});

// Initialize multer with the storage configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024, files: 50 }, // 500 MB and max 50 files
});

// Create the uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Endpoint to handle image uploads
app.post('/upload', upload.array('images'), (req, res) => {
  try {
    if (!req.body.baseName) {
      return res.status(400).json({ message: 'Base name is required' });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Renaming files based on user input and sending response
    const renamedFiles = files.map((file, index) => {
      const newFileName = `${req.body.baseName}-${index + 1}${path.extname(file.originalname)}`;
      const oldPath = path.join(__dirname, 'uploads', file.filename);
      const newPath = path.join(__dirname, 'uploads', newFileName);
      
      // Check if the old file exists before renaming
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath); // Rename the file
      } else {
        console.error(`File not found: ${oldPath}`);
      }

      return newFileName;
    });

    return res.status(200).json({
      message: 'Files uploaded and renamed successfully',
      baseName: req.body.baseName,
      files: renamedFiles,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return res.status(500).json({ message: error.message || 'Failed to upload files' });
  }
});

app.delete('/clear-uploads', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return res.status(500).json({ message: 'Failed to read uploads directory' });
    }

    const deletePromises = files.map(file => {
      return fs.promises.unlink(path.join(uploadsDir, file));
    });

    Promise.all(deletePromises)
      .then(() => {
        console.log('Uploads directory cleared');
        res.status(200).json({ message: 'Uploads cleared successfully' });
      })
      .catch(error => {
        console.error('Error deleting files:', error);
        res.status(500).json({ message: 'Failed to delete files' });
      });
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
