import express from "express";
import multer from "multer";
import { 
    getAllDapodik,
    getDapodikById,
    createDapodik, 
    updateDapodik,
    deleteDapodik,
    searchDapodik,
    findDapodikByNIK,
    downloadTemplate,
    importExcel
} from '../controllers/dapodik.controller.js';

const router = express.Router();

// Konfigurasi multer untuk menerima file Excel
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('File harus berformat Excel (.xlsx atau .xls)'), false);
        }
    }
});

// Route untuk mencari data dapodik berdasarkan NIK dengan data wilayah
router.get('/find/:nik', findDapodikByNIK);

router.get("/", getAllDapodik);
router.get("/:id", getDapodikById);
router.post("/", createDapodik);
router.put("/:id", updateDapodik);
router.delete("/:id", deleteDapodik);
router.get("/download/template", downloadTemplate);
router.post("/import", upload.single('file'), importExcel);

export default router;