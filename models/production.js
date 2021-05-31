const mongoose = require("mongoose");
const Schema = mongoose.Schema;


// const productionSchema = new Schema({ 
//     name: { type: "string", required: true},
//     licenses: { type: "array", default: [] },
//     locations: [
//         {
//             location: { type: Schema.Types.ObjectId, ref: 'Location'},
//             employees: [
//                 { type: Schema.Types.ObjectId, ref: 'Employee' }
//             ]
//         }
//     ]
// });

const productionSchema = new Schema({
  name: { type: "string", required: true },
  licenses: { type: "array", default: [] },
  locations: [
    {
      name: { type: "string", required: true },
      address: {
        line1: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        country: { type: String, default: "" },
        postCode: { type: String, required: true },
      },
    },
  ]
});

const Production = mongoose.model("Production", productionSchema);

module.exports = {
  Production,
};




