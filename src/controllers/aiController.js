// Controllers/hadithController.js

const { Document } = require("langchain/document");
const { CharacterTextSplitter } = require("langchain/text_splitter");
const { VectorDBQAChain } = require("langchain/chains");
const { OpenAI } = require("langchain/llms/openai");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { DocxLoader } = require("langchain/document_loaders/fs/docx");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const fs = require("fs");
const uploadDir = "uploads";
const vectorDatabase = "vectorDatabase";

//add new Hadith
const addOneFileForAi = async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.files) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    // Extract the moduleName from req?.body?.data.moduleName
    const data = JSON.parse(req?.body?.data) || "demo";
    const { moduleName } = data;

    // Get the uploaded file
    const file = req?.files[0];
    const fileName = file?.originalname;

    // Determine the file extension
    const fileExtension = fileName?.split(".")?.pop()?.toLowerCase();
    console.log(fileExtension);

    // Check if the file extension is supported
    const oldFilePath = `${uploadDir}/demo`;
    const newFilePath = `${uploadDir}/${moduleName}`;

    // Check if the file exists
    if (!fs.existsSync(oldFilePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Rename the uploaded file to the custom moduleName
    fs.renameSync(oldFilePath, newFilePath); // Rename the file

    // Load the document from the uploaded file based on the file type
    let document;
    if (fileExtension === "pdf") {
      const pdfLoader = new PDFLoader(newFilePath);
      document = await pdfLoader.load();
    } else if (fileExtension === "docx") {
      const docxLoader = new DocxLoader(newFilePath);
      document = await docxLoader.load();
      // Process the PDF content and save chunks on the local file system
      const splitter = new CharacterTextSplitter({
        chunkSize: 1536,
        chunkOverlap: 200,
      });
      document = await splitter.splitDocuments(document);
    } else {
      return res.status(400).json({ error: "Unsupported file type." });
    }

    // Process the PDF content and save chunks on the local file system
    const splitter = new CharacterTextSplitter({
      chunkSize: 1536,
      chunkOverlap: 200,
    });

    const chunkDir = `${vectorDatabase}/chunks/${moduleName}`;
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    const chunkFilePaths = [];
    for (let i = 0; i < document.length; i++) {
      const page = document[i];
      const docOutput = await splitter.splitDocuments([
        new Document({ pageContent: page.pageContent }),
      ]);

      const chunkFileName = `${moduleName}_chunk_${i + 1}.json`;
      const chunkFilePath = `${chunkDir}/${chunkFileName}`;
      fs.writeFileSync(chunkFilePath, JSON.stringify(docOutput, null, 2));
      chunkFilePaths.push(chunkFilePath);
    }

    res.json({
      message: "File uploaded successfully",
      moduleName: moduleName,
      chunkFilePaths: chunkFilePaths,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
};

const processOneQueryFromAi = async (req, res) => {
  try {
    // Path to the uploaded PDF file
    const data = req?.body?.data;
    const { question, moduleName } = JSON.parse(data);

    // Path to the directory containing saved chunks
    const chunkDir = `${vectorDatabase}/chunks/${moduleName}`;

    // Check if the directory exists
    if (!fs.existsSync(chunkDir)) {
      return res.status(404).json({ error: "Chunks directory not found" });
    }

    // Read the saved chunks from the local file system
    const chunkFilePaths = fs.readdirSync(chunkDir);
    const docs = [];
    for (const chunkFilePath of chunkFilePaths) {
      const filePath = `${chunkDir}/${chunkFilePath}`;
      const chunkData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      docs.push(...chunkData);
    }

    // Load the docs into the vector store using the OpenAIEmbeddings format
    const vectorStore = await MemoryVectorStore.fromDocuments(
      docs,
      new OpenAIEmbeddings()
    );

    // Create a chain for the vector store
    const model = new OpenAI();
    const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
      k: 1,
      returnSourceDocuments: true,
    });

    // Ask the question and process the response
    const response = await chain.call({ query: question });
    const finalResponse = response?.text;

    // Log and send the processed response
    console.log(finalResponse);
    res.json({ finalResponse });
  } catch (error) {
    console.error("Error processing query:", error);
    res.status(500).json({ error: "Failed to process the query" });
  }
};

module.exports = {
  addOneFileForAi,
  processOneQueryFromAi,
};
