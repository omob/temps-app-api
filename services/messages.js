const { Message } = require("../models/message");
const { Employee: User } = require("../models/employee");
const winston = require("winston");
const { notifyUsersViaPushNotifications } = require("./notifications");

/**
 *   $and: [
          {
            $or: [{ recipientId: req.user._id }, { senderId: userId }],
          },
          { $or: [{ recipientId: userId }, { senderId: req.user._id }] },
        ],
 */

const getAllMyMessages = async (req, res) => {
  const allMessagesWithUser = await Message.find({
    $or: [{ recipient: req.user._id }, { sender: req.user._id }],
  })
    .populate({ path: "messages.user", select: "name profileImageUrl" })
    .populate({ path: "recipient", select: "name profileImageUrl" })
    .populate({ path: "sender", select: "name profileImageUrl" });

  res.send(allMessagesWithUser);
};

const getMessages = async (req, res, next) => {
  const { userId } = req.params;

  const allMessagesWithUser = await Message.find({
    $and: [{ recipient: userId }, { sender: req.user._id }],
  })
    .populate({ path: "messages.user", select: "name profileImageUrl" })
    .populate({ path: "recipient", select: "name profileImageUrl" })
    .populate({ path: "sender", select: "name profileImageUrl" });

  res.send(allMessagesWithUser);
};

const postMessage = async (req, res, next) => {
  const { id: messageId } = req.params;

  const senderId = req.user._id;
  const { text } = req.body;

  const messageInDB = await Message.findOneAndUpdate(
    { _id: messageId },
    {
      $push: {
        messages: {
          user: senderId,
          text,
          date: new Date(),
        },
      },
    }
  );

  const userIdToNotify =
    senderId !== messageInDB.sender
      ? messageInDB.recipient
      : messageInDB.sender;

  const userInfo = await _getUserInfoById(userIdToNotify);
  if (userInfo.expoPushTokens) {
    const pushData = {
      pushTokens: userInfo.expoPushTokens,
      message: { text: "You have a new message" },
    };
    await notifyUsersViaPushNotifications(Array.of(pushData));
  }
  winston.info(`SENT NEW MESSAGE`);
  return res.status(200).send();
};

const createNewMessage = async (req, res, next) => {
  const sender = req.user._id;
  const isSenderAdmin = req.user.roles && req.user.roles.admin;
  const { recipientId, text } = req.body;

  const newMessage = new Message({
    recipient: recipientId,
    sender,
    isSenderAdmin,
    messages: {
      user: sender,
      text,
      date: new Date(),
    },
  });

  await newMessage.save();
  const userInfo = await _getUserInfoById(recipientId);
  if (userInfo.expoPushTokens) {
    const pushData = {
      pushTokens: userInfo.expoPushTokens,
      message: { text: "You have a new message" },
    };
    await notifyUsersViaPushNotifications(Array.of(pushData));
  }

  winston.info(`CREATED A NEW MESSAGE`);
  return res.status(204).json(newMessage);
};

const _getUserInfoById = async (id) => {
  return await User.findById({ _id: id }).select("name email expoPushTokens");
};

module.exports = {
  getMessages,
  postMessage,
  createMessage: createNewMessage,
  getAllMyMessages,
};
