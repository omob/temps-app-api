const { validateContract, validateContractOnUpdate } = require("../functions/contract");
const { Contract } = require("../models/contract");
const { Location } = require("../models/location");
const { Production } = require("../models/production");
const _ = require("lodash");


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
      const savedProduction = await Production.create({ ...production });
      return {_id: savedProduction._id } ;
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

  const contractInDb = await _getContractById(savedContract._id);
  console.log(contractInDb)
  res.status(201).json({ data: contractInDb, message: "success" });
};

const _contractReadDTo = (contract) => {
  const {productions, ...otherProps } = contract;
  
  const mappedProduction = productions.map(({ _id}) => ({ ..._id._doc}))

  const _mappedContract = {...otherProps._doc, productions: mappedProduction};
  
  return _mappedContract;
}

const _getContractById = async (contractId) => {
  const contract =  await Contract.findById(contractId)
  .populate({
    path: "productions._id",
    model: "Production"
  })
  .select({ "productions.isDeleted": 0 })
  
  if(!contract) return null;

  return _contractReadDTo(contract)
}

const updateContract = async (req, res) => {
  const { id: contractId } = req.params;

  const { error } = validateContractOnUpdate(req.body);
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

   let productionsId; 


   // get all productions in contract

  //  const productionsInContract = await Contract.findById(contractId)
  //    .select("productions")
  //    .populate({
  //      path: "productions._id",
  //      model: "Production",
  //    });
  // const mappedProductionsInDb = _contractReadDTo(productionsInContract).productions;

  //  return res.send(mappedProductionsInDb);
  //  console.log(productions)
   if (productions && productions.length > 0) {
     productionsId = await Promise.all(await productions.map(async (production) => {
       
       const { _id, licenses, name, locations } = production;

        let updatedProduction = await Production.findByIdAndUpdate(_id, { licenses, name, locations });
    
        if (!updatedProduction) {
           updatedProduction = await Production.create({ ...production });
        }
        return { _id: updatedProduction._id }
      }));
   }


   await Contract.findByIdAndUpdate(contractId, {
     name,
     contactNumber,
     email,
     businessType,
     address,
     inRate,
     productions: productionsId,
   });

   const contractInDb  = await _getContractById(contractId);
   res.send(contractInDb);
};

const getAllContracts = async (req, res) => {
   const contracts = await Contract.find({})
     .populate({ path: "productions._id", model: "Production" })
     .select({ "productions.isDeleted": 0 });
  
  const mappedContract = contracts.map((contract) => (_contractReadDTo(contract)));

   res
    .status(200)
    .send({ data: mappedContract, message: "success"});
};

const getContractProfile = async (req, res) => {
  const { id } = req.params;
  const contractInDb = await _getContractById(id);

  if (!contractInDb) return res.status(404).send("Contract not found");

  res.status(200).json({ data: contractInDb, message: "success" });
};


module.exports = {
  createContract,
  updateContract,
  getAllContracts,
  getContractProfile,
  updateContract
};
