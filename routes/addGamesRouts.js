// import express from "express";
// import multer from "multer";
// import { postAdd, addGame } from "../controllers/gameController.js";
// import path from "path";
// const router = express.Router();

// // const upload = multer({
// //   dest: 'public/uploads/games/',
// //   limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
// // });

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads/games/");
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 },
// });

// router.get("/admin/addgame", addGame);
// router.post("/admin/addgame",upload.fields([ { name: "coverImage", maxCount: 1 },{ name: "screenshots", maxCount: 5 },]),postAdd);

// export default router;
