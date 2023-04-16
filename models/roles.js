const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rolesSchema = new Schema({
  admin: {
    type: Array,
    userId: { type: Schema.Types.ObjectId },
  },
  employee: {
    type: Array,
    userId: { type: Schema.Types.ObjectId },
    default: [],
  },
});

const Roles = mongoose.model("Role", rolesSchema);

const initializeRoles = async () => {
  const roles_ = new Roles();
  await roles_.save();
};

Roles.findOne({}).exec(async (err, roles) => {
  if (!roles || roles.length === 0) initializeRoles();
});

module.exports = { Roles };
