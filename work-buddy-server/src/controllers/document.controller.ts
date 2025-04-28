import { Request, Response } from "express";

import { FilesLoaderService } from "@/lib/services/FileLoaderService";
import { PGVectorService } from "@/lib/services/PGVectorService";

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { filePath } = req.body;
    console.log("req.file", req.file);

    if (file) {
      const filesLoaderService = new FilesLoaderService();
      const docs = await filesLoaderService.loadFiles([{ ...file, filePath }]);

      const pgService = new PGVectorService();
      await pgService.insertVectorDocuments(docs);
    }

    // Simulate document upload
    console.log("Document uploaded successfully");
    res
      .status(200)
      .json({ success: true, error: null, data: { file: file?.originalname } });
  } catch (err) {
    console.log("error in Uploading document", err);
    res.status(500).json({ success: false, error: err, data: null });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { fileName = "", filePath = "" } = req.body;
    console.log("req.body", req.body);

    const pgService = new PGVectorService();
    // await pgService.connect();
    const deleteRes = await pgService.deleteDocumentsByMetadata(
      fileName,
      filePath
    );

    console.log("deleteRes", deleteRes);

    if (deleteRes.success) {
      res.status(200).json({ success: true, error: null, data: req.body });
    } else {
      res
        .status(400)
        .json({ success: false, error: deleteRes.error, data: null });
    }
    // Simulate document upload
  } catch (err) {
    console.log("error in deleting document", err);
    res.status(500).json({ success: false, error: err, data: null });
  }
};
