const { validateContract } = require("../functions/contract");
const { Contract } = require("../models/contract");
const { Location } = require("../models/location");
const { Production } = require("../models/production");

const createContract = async (req, res) => {
  const { error } = validateContract(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const {
    name,
    contactNumber,
    email,
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

  const productionsId = productions && await Promise.all(
    await productions.map(async (production) => {
      // each production contains an array of locations
      
	  // let locationsRecord;

	  // if (production.locations) {
		//  locationsRecord = (
		// 	await Location.insertMany([...production.locations])
		// 	).map((location) => ({ location: location._id }));
	  // }

    //   const { locations, ...otherFields } = production;
      // const savedProduction = await Production.create({
      //   ...otherFields,
      //   locations: locationsRecord,
      // });

      const savedProduction = await Production.create({ ...production })

      return savedProduction._id;
    })
  );

  contract = new Contract({
    name,
    email,
    contactNumber,
    address,
    businessType,
    inRate,
    productions: productionsId,
  });

  const savedContract = await contract.save();

  const fetchedContract = await Contract.findById(savedContract._id).populate({
    path: "productions",
    model: "Production",
  });
  
  res.status(201).json({ data: fetchedContract, message: "success"});
};

const updateContract = async (req, res) => {

};

const getAllContracts = async (req, res) => {
   const contracts = await Contract.find({})
    .populate({
      path: "productions",
      model: "Production",
    });
  
   res
    .status(200)
    .send({ data: contracts, message: "success"});
};

const getContractProfile = async (req, res) => {
  const { id } = req.params;
  const contractInDb = await Contract.findById(id).populate({
    path: "productions",
    model: "Production",
  });

  if (!contractInDb) return res.status(404).send("Contract not found");

  res.status(200).json({ data: contractInDb, message: "success" });
};

module.exports = {
  createContract,
  updateContract,
  getAllContracts,
  getContractProfile
};
