import express from "express";
import multer from "multer";

import {
  addAudioMessage,
  addImageMessage,
  addMessage,
  getInitialContactsWithMessages,
  getMessages,
} from "../controllers/MessageController.js";
import { checkBody, checkQuery } from "../utils/helpers.js";

const router = express.Router();

const uploadImage = multer({ dest: "uploads/images" });
const uploadAudio = multer({ dest: "uploads/recordings" });

router.post("/add-message", checkBody(["from", "to", "message"]), addMessage);
router.post("/get-messages", checkBody(["from", "to"]), getMessages);
router.post(
  "/add-image-message",
  checkQuery(["from", "to"]),
  uploadImage.single("image"),
  addImageMessage
);
router.post(
  "/add-audio-message",
  checkQuery(["from", "to"]),
  uploadAudio.single("audio"),
  addAudioMessage
);
router.get("/get-initial-contacts/:from", getInitialContactsWithMessages);

export default router;
