const { Contract } = require("../models/contract");
const { Employee } = require("../models/employee");

const dashboardInfo = async (req, res) => {
    // Total People
    // Total Contract 
    // Activities

    const employeeCount = await Employee.find({}).countDocuments();

    const contractCount = await Contract.find({}).countDocuments();

    const activities = {

    }

    res.status(200).json({ data: {
        employeeCount, contractCount, activities
    }, message: "success" })
};


module.exports = {
  dashboardInfo,
};