const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const productionSchema = new Schema({ 
    name: { type: "string", required: true},
    licenses: { type: "array", default: [] },
    locations: [
        {
            location: { type: Schema.Types.ObjectId, ref: 'Location'},
            employees: [
                { type: Schema.Types.ObjectId, ref: 'Employee' }
            ]
        }
    ]
});

const Production = mongoose.model("Production", productionSchema);

module.exports = {
  Production,
};




