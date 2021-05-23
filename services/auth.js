const { Employee: User } = require("../models/employee");
const Joi = require("joi");

const config = require('config');
const { getUserRoles } = require("../functions/user");

const validateLogin = (requestBody) => {
  const schema = {
    email: Joi.string().min(5).max(255).required(),
    password: Joi.string().min(5).max(255).required(),
  };

  return Joi.validate(requestBody, schema);
};


const login = async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { email, password } = req.body;

  let userEmail = email;

  //check if user did not include domain name.
  if (!userEmail.includes("@") && !userEmail.includes(`@${config.get("domainName")}`)) {
    userEmail = `${userEmail}@${config.get("domainName")}`;
  }

  let user = await User.findOne({ email: userEmail });
  if (!user) return res.status(400).send("Invalid email or password."); // just to make imposter think both is wrong

  const validPassword = await user.comparePassword(password);
  if (!validPassword) return res.status(400).send("Invalid email or password.");

  if (!user.canLogin)
    return res
      .status(403)
      .send("Your access has been revoked! Please Contact Admin");

  if (user.isDeleted) return res.status(403).send("Account has been deleted!");

  user.userRoles = await getUserRoles(user._id);

  const token = user.generateAuthToken();
  res.send(token);
};

module.exports = {
  login,
};
