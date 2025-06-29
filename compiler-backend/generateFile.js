import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

const getExtension = (language) => {
    switch(language) {
        case 'cpp': return 'cpp';
        case 'python': return 'py';
        case 'java': return 'java';
        default: return 'txt';
    }
};

const generateFile = (language, content) => {
    const dirCodes = path.join(__dirname, 'codes');
    if (!fs.existsSync(dirCodes)) {
        fs.mkdirSync(dirCodes, { recursive: true });
    }
    const jobID = uuid();
    const extension = getExtension(language);
    const filename = `${jobID}.${extension}`;
    const filePath = path.join(dirCodes, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
};

export { generateFile }; 