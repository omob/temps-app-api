const {
  validateContract,
  validateContractOnUpdate,
} = require("../functions/contract");
const { Contract } = require("../models/contract");
const { Location } = require("../models/location");
const { Production } = require("../models/production");
const { Shift } = require("../models/shift");
const winston = require("winston");
const _ = require("lodash");

const createContract = async (req, res) => {
  const { error } = validateContract(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const {
    name,
    contactNumber,
    email,
    invoiceEmail,
    businessType,
    address,
    productions,
    inRate,
  } = req.body;

  let contract = await Contract.findOne({
    $or: [{ email }, { name }],
  });

  if (contract)
    return res
      .status(400)
      .json("A contract with same email or name already exists.");

  const productionsId =
    productions &&
    (await Promise.all(
      await productions.map(async (production) => {
        const savedProduction = await Production.create({ ...production });
        return { _id: savedProduction._id };
      })
    ));

  contract = new Contract({
    name,
    email,
    invoiceEmail,
    contactNumber,
    address,
    businessType,
    inRate,
    productions: productionsId,
  });

  const savedContract = await contract.save();

  const contractInDb = await _getContractById(savedContract._id);
  res.status(201).json({ data: contractInDb, message: "success" });
};

const _contractReadDTo = (contract) => {
  const { productions, ...otherProps } = contract;

  const mappedProduction =
    productions && productions.map(({ _id }) => ({ ..._id._doc }));

  const _mappedContract = { ...otherProps._doc, productions: mappedProduction };

  return _mappedContract;
};

const _getContractById = async (contractId) => {
  const contract = await Contract.findById(contractId)
    .populate({
      path: "productions._id",
      model: "Production",
      select: "-__v -productions.isDeleted",
    })
    .select("-__v -createdDate");

  if (!contract) return null;

  return _contractReadDTo(contract);
};

const updateContract = async (req, res) => {
  const { id: contractId } = req.params;

  const { error } = validateContractOnUpdate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const {
    name,
    contactNumber,
    email,
    invoiceEmail,
    businessType,
    address,
    productions,
    inRate,
  } = req.body;

  let productionsId = [];

  // get all productions in contract

  if (productions && productions.length > 0) {
    productionsId = await Promise.all(
      await productions.map(async (production) => {
        const { _id, licenses, name, locations } = production;

        let updatedProduction = await Production.findByIdAndUpdate(_id, {
          licenses,
          name,
          locations,
        });

        if (!updatedProduction) {
          updatedProduction = await Production.create({ ...production });
        }
        return { _id: updatedProduction._id };
      })
    );
  }

  await Contract.findByIdAndUpdate(contractId, {
    name,
    contactNumber,
    email,
    invoiceEmail,
    businessType,
    address,
    inRate,
    productions: productionsId,
  });

  const contractInDb = await _getContractById(contractId);
  res.status(200).json({ data: contractInDb, message: "success" });
};

const getAllContracts = async (req, res) => {
  const contracts = await Contract.find({})
    .populate({ path: "productions._id", model: "Production" })
    .select({ "productions.isDeleted": 0 });

  const mappedContract = contracts.map((contract) =>
    _contractReadDTo(contract)
  );
  res.status(200).send(mappedContract);
};

const getContractProfile = async (req, res) => {
  const { id } = req.params;
  const contractInDb = await _getContractById(id);

  if (!contractInDb) return res.status(404).send("Contract not found");
  res.status(200).json(contractInDb);
};

const getAllContractWithEmployeesCount = async (req, res) => {
  const contracts = await Contract.find({}).select("name address.city inRate");

  const _allContract = [];
  await Promise.all(
    contracts.map(async (contract) => {
      const totalEmployees = await Shift.find({
        "contractInfo.contract": contract._id,
        status: { $ne: "OUTDATED" },
      }).distinct("employee");

      _allContract.push({
        ...contract.toObject(),
        location: contract.address.city,
        totalEmployees: totalEmployees.length,
      });
    })
  );

  let sortedContracts = _allContract.sort(
    (a, b) => a?.name?.charAt(0).charCodeAt() - b?.name?.charAt(0).charCodeAt()
  );

  res.status(200).send(sortedContracts);
};

const getEmployeesShiftInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const shiftRecord = await Shift.find(
      {
        "contractInfo.contract": id,
        status: { $ne: "OUTDATED" },
      }
      // { select: "contractInfo.production.name contractInfo.outRate" }
    )
      .select(
        "contractInfo.production contractInfo.location contractInfo.outRate time employee date"
      )
      .populate("employee", "name")
      .populate("contractInfo.production")
      .sort("date");

    const employeesShiftsInfo = [];

    shiftRecord.forEach(({ contractInfo, employee, time, _id, date }) => {
      let { production, location, outRate } = contractInfo;
      production.locations.forEach((loc) => {
        if (loc._id.toString() === location.toString()) {
          location = loc;
        }
      });
      employeesShiftsInfo.push({
        _id,
        production: production.name,
        location: location.name,
        name: employee.name,
        outRate,
        startToFinish: `${time.start} - ${time.end}`,
        hours: parseInt(time.end) - parseInt(time.start),
        date,
      });
    });

    res.status(200).send(employeesShiftsInfo);
  } catch (err) {
    winston.error(err);
    res.send(400).send("Something went wrong");
  }
};

module.exports = {
  createContract,
  updateContract,
  getAllContracts,
  getContractProfile,
  updateContract,
  getAllContractWithEmployeesCount,
  getEmployeesShiftInfo,
};
