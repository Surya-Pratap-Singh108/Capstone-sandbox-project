import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

const WORKING_DIR='/workspace'

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Hello, World!',
        status: 'success'
    }); 
});

//list all the files in the working directory and its subdirectories. The response should be a JSON object with a file paths relative to the working directory exclude directories like node_modules,.git,dist etc.
app.get('/list-files', async (req, res) => {

    async function listFiles(dir,basedir) {

        let result = [];

        const entries = await fs.promises.readdir(dir, {
            withFileTypes: true
        });

        for (const entry of entries) {

            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(basedir, fullPath);

            // Ignore these folders
            if (
                entry.isDirectory() &&
                (entry.name === "node_modules" ||
                 entry.name === ".git" ||
                 entry.name === "dist")
            ) {
                continue;
            }

            if (entry.isDirectory()) {

                const subFiles = await listFiles(fullPath, basedir);

                result.push(...subFiles);

            } else {

                result.push(relativePath);

            }
        }

        return result;
    }

    try {

        const files = await listFiles(WORKING_DIR, WORKING_DIR);

        res.json({
            status: "Files listed successfully",
            files
        });

    } catch (err) {

        res.status(500).json({
            status: "error",
            message: err.message
        });

    }

});

//read the content of files specified in the query parameter 'files'. The query parameter should be a comma-separated list of file names.
//eg: /read-files?files=file1.txt,file2.txt
app.get('/read-files', async(req, res) => {

    const files=req.query.files;
    if(!files) {
        return res.status(400).json({
            message: 'No files provided',
            status: 'error'
        });
    }
    const fileList = files.split(',');

    const results=await Promise.all(fileList.map(async (file) => {

        const filePath = path.join(WORKING_DIR, file);
        try {
            const data = await fs.promises.readFile(filePath, 'utf-8');
            return{
                [filePath.replace(WORKING_DIR + '/', '')]: data,
            }
        } catch (err) {
            return {
                [filePath]: `Error reading file: ${err.message}`,
            }
        }
    }));

    res.status(200).json({
        message: 'File contentss',
        files:results,
        status: 'success',
    });
});

// update the content of files specified in the query parameter. The request body should contain a property 'updates' with a JSON Array of object,each object should have a 'file'(specifying the file path) and 'content' property with the new content for each file.

app.patch('/update-files', async(req, res) => {

    const updates=req.body.updates;
    if(!updates || !Array.isArray(updates)) {
        return res.status(400).json({
            message: 'Invalid updates format. Expected an JSON object with an updates property containing an array of objects with "file" and "content" properties.',
            status: 'error'
        });
    }

    const results=await Promise.all(updates.map(async (update) => {
        const { file, content } = update;
        const filePath  = path.join(WORKING_DIR, file);
        try {
            await fs.promises.mkdir(path.dirname(filePath), {
    recursive: true
});
            await fs.promises.mkdir(path.dirname(filePath), {
                recursive: true
            });

            await fs.promises.writeFile(filePath, content, "utf-8");
            return {
                [filePath]: 'File updated successfully',
            };
        } catch (err) {
            return {
                [filePath]: `Error updating file: ${err.message}`,
            };
        }
    }));

    res.status(200).json({
        message: 'File updates completed',
        results,
        status: 'success',
    });
});

//creates a new files with the content specified in the request body.the request body should contain a property 'files' with a JSON Array of objects, each object should have a 'file' property (specifying the file name) and a 'content' property (specifying the content of the file).

app.post('/create-files', async(req, res) => {

    const files = req.body.files;

    if(!files || !Array.isArray(files)) {
        return res.status(400).json({
            message: 'Invalid files format. Expected an JSON object with a files property containing an array of objects with "file" and "content" properties.',
            status: 'error'
        });
    }
    const results=await Promise.all(files.map(async (fileObj) => {
        const { file, content } = fileObj;
        const filePath  = path.join(WORKING_DIR, file);
        try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

            await fs.promises.writeFile(filePath, content,'utf-8');
            return {
                [filePath.replace(WORKING_DIR + '/', '')]: 'File created successfully',
            };
        } catch (err) {
            return {
                [filePath]: `Error creating file: ${err.message}`,
            };
        }
    }));

    res.status(200).json({
        message: 'Files created successfully',
        results,
        status: 'success',
    });
});

export default app;
