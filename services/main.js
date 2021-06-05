const { Contract } = require("../models/contract");
const { Employee } = require("../models/employee");

const dashboardInfo = async (req, res) => {
    // Total People
    // Total Contract 
    // Activities

    const employeeCount = await Employee.find({}).countDocuments();

    const contractCount = await Contract.find({}).countDocuments();

    const activities = [];

    res.status(200).json({
        employeeCount, contractCount, activities
    })
};

const stats = async (req, res) => {
  const employeeCount = await Employee.find({}).countDocuments();

  const contractCount = await Contract.find({}).countDocuments();

  res.status(200).json({
      employeeCount,
      contractCount
    });
}

// mock data
 const allActivitiesData = [
   {
     id: "001",
     heading: "Awaiting Approval",
     type: "approval",
     message: "James Williams documents are awaiting approval",
     url: "...",
     isRead: false,
   },
   {
     id: "002",
     heading: "Awaiting Approval",
     type: "approval",
     message: "Micheal Opayemi Williams documents are awaiting approval",
     url: "...",
     isRead: false,
   },
   {
     id: "003",
     heading: "Awaiting Approval",
     type: "approval",
     message: "James Williams documents are awaiting approval",
     url: "...",
     isRead: false,
   },
 ];


module.exports = {
  dashboardInfo,
  stats
};