import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import getPrismaInstance from "../utils/PrismaClient.js";
import fs from "fs";

export const addMessage = catchAsync(async (req, res, next) => {
  const prisma = getPrismaInstance();

  const { message, from, to } = req.body;

  // check if user is online from global map
  const getUser = onlineUsers.get(to);

  const newMessage = await prisma.messages.create({
    data: {
      message,
      sender: { connect: { id: parseInt(from) } },
      reciever: { connect: { id: parseInt(to) } },
      messageStatus: getUser ? "delivered" : "sent",
    },
    include: {
      sender: true,
      reciever: true,
    },
  });

  res.status(201).json({
    msg: "Message sent",
    status: true,
    data: newMessage,
  });
});

export const getMessages = catchAsync(async (req, res, next) => {
  const { from, to } = req.body;

  const prisma = getPrismaInstance();

  const messages = await prisma.messages.findMany({
    where: {
      OR: [
        // messages sent by me
        {
          senderId: parseInt(from),
          recieverId: parseInt(to),
        },

        // messages received to me
        {
          senderId: parseInt(to),
          recieverId: parseInt(from),
        },
      ],
    },
    orderBy: {
      id: "asc",
    },
  });

  const unreadMessages = [];

  messages.forEach((message) => {
    if (message.messageStatus !== "read" && message.senderId === parseInt(to)) {
      message.messageStatus = "read";
      unreadMessages.push(message.id);
    }
  });

  await prisma.messages.updateMany({
    where: {
      id: { in: unreadMessages },
    },
    data: {
      messageStatus: "read",
    },
  });

  res.status(200).json({
    status: true,
    msg: "all messages",
    data: messages,
  });
});

export const addImageMessage = catchAsync(async (req, res, next) => {
  if (!req.file) return new AppError("No file pass through req", 400);

  const date = Date.now();
  const filename =
    "uploads/images/" + date.toString() + "-" + req.file.originalname;

  fs.renameSync(req.file.path, filename);
  const prisma = getPrismaInstance();
  const { from, to } = req.query;

  const message = await prisma.messages.create({
    data: {
      message: filename,
      type: "image",
      sender: { connect: { id: parseInt(from) } },
      reciever: { connect: { id: parseInt(to) } },
    },
  });

  res.status(200).json({
    status: true,
    msg: "File uploaded successfully",
    data: message,
  });
});

export const addAudioMessage = catchAsync(async (req, res, next) => {
  if (!req.file) return new AppError("No audio file pass through req", 400);

  const date = Date.now();
  const filename =
    "uploads/recordings/" + date.toString() + "-" + req.file.originalname;

  fs.renameSync(req.file.path, filename);
  const prisma = getPrismaInstance();
  const { from, to } = req.query;

  const message = await prisma.messages.create({
    data: {
      message: filename,
      type: "audio",
      sender: { connect: { id: parseInt(from) } },
      reciever: { connect: { id: parseInt(to) } },
    },
  });

  res.status(200).json({
    status: true,
    msg: "File uploaded successfully",
    data: message,
  });
});

export const getInitialContactsWithMessages = catchAsync(
  async (req, res, next) => {
    const userId = parseInt(req.params.from);
    const prisma = getPrismaInstance();

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        sentMessages: {
          include: {
            reciever: true,
            sender: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        recievedMessages: {
          include: {
            reciever: true,
            sender: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const messages = [...user.sentMessages, ...user.recievedMessages];

    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const users = new Map();

    const messageStatusChange = [];

    messages.forEach((msg) => {
      const isSender = msg.senderId === userId;
      const calculatedId = isSender ? msg.recieverId : msg.senderId;
      if (msg.messageStatus === "sent") {
        messageStatusChange.push(msg.id);
      }

      if (!users.get(calculatedId)) {
        const {
          id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId,
          recieverId,
        } = msg;

        let user = {
          messageId: id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId,
          recieverId,
        };

        if (isSender) {
          user = {
            ...user,
            ...msg.reciever,
            totalUnreadMessages: 0,
          };
        } else {
          user = {
            ...user,
            ...msg.sender,
            totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
          };
        }

        users.set(calculatedId, { ...user });
      } else if (msg.messageStatus !== "read" && !isSender) {
        const user = users.get(calculatedId);

        users.set(calculatedId, {
          ...user,
          totalUnreadMessages: user.totalUnreadMessages + 1,
        });
      }
    });

    if (messageStatusChange.length) {
      await prisma.messages.updateMany({
        where: {
          id: { in: messageStatusChange },
        },
        data: {
          messageStatus: "delivered",
        },
      });
    }

    res.status(200).json({
      msg: "all messages",
      users: Array.from(users.values()),
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  }
);
