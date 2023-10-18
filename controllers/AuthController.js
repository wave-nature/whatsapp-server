import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import getPrismaInstance from "../utils/PrismaClient.js";
import { generateToken04 } from "../utils/TokenGenerator.js";

export const checkUser = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const prisma = getPrismaInstance();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return next(new AppError("User not found", 404));

  return res.json({
    msg: "user found",
    status: true,
    data: user,
  });
});

export const onBoardUser = catchAsync(async (req, res, next) => {
  const { email, name, about, profileImage } = req.body;

  const prisma = getPrismaInstance();

  const user = await prisma.user.create({
    data: {
      email,
      name,
      about,
      profileImage,
    },
  });

  res.status(201).json({
    msg: "success",
    status: true,
    data: user,
  });
});

export const getAllUsers = catchAsync(async (req, res, next) => {
  const prisma = getPrismaInstance();
  const users = await prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      email: true,
      name: true,
      profileImage: true,
      about: true,
    },
  });

  const usersGroupByInitialLetter = {};

  users.forEach((user) => {
    const firstLetter = user.name.charAt(0).toUpperCase();

    if (!usersGroupByInitialLetter[firstLetter]) {
      usersGroupByInitialLetter[firstLetter] = [];
    }

    usersGroupByInitialLetter[firstLetter].push(user);
  });

  res.status(200).json({
    msg: "user by initial letter",
    status: true,
    results: users.length,
    users: usersGroupByInitialLetter,
  });
});

export const generateToken = catchAsync(async (req, res, next) => {
  const appId = parseInt(process.env.ZEGO_APP_ID);
  const serverSecret = String(process.env.ZEGO_SERVER_ID).trim();

  const userId = req.params.userId;
  const effectiveTime = 3600;
  const payload = "";

  if (!appId || !serverSecret)
    return next(new AppError("user id , server secret and app id is required"));

  const token = generateToken04(
    appId,
    userId,
    serverSecret,
    effectiveTime,
    payload
  );

  res.status(200).json({
    status: true,
    token,
  });
});
