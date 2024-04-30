const mongoose = require("mongoose");
require('dotenv').config();
const link = 'mongodb+srv://subhadipmondal789:DrugDatadatabase%409809@drugdata.xj4ds8z.mongodb.net/Drug?retryWrites=true&w=majority&appName=DrugData';

mongoose.connect(link)

    .then(() => {
        console.log("MongoDB Connected To Atlas");
    })
    .catch((error) => {
        console.error("MongoDB Failed to connect:", error);
    });


   const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
  },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        }
    });
    
    const User = mongoose.model("User", UserSchema,"user");
const Schema = mongoose.Schema;

const PatientSchema = new mongoose.Schema({
    FirstName:String,
    lastName:String,
    DOB:String,
    Sex:String,
    Height:Number,
    Weight: Number,
    MaritialStatus:String,
    ContactNumber:Number,
    Email:String,
    EmergencyNumber:Number,
    AdharNo:Number,
});
const Patient = mongoose.model("Patient", PatientSchema,"patient");

//Prescription Scemha
const currentTime = new Date();

const prescriptionSchema = new mongoose.Schema({
    name:String,
    adharnum:Number,
    medicines:[{
        rank:String,
        id:String,
        medicineName:String,
        quantity:String,
        price:Number,
        
      }],
      review:String,
      medicalRequirements:String,
      createdAt: {
        type: Date,
        default: Date.now
    },
    docname:String,
});

// Create a model for the prescription schema
const Prescription = mongoose.model('Prescription', prescriptionSchema,"Prescriptions");

// Define your schema
const MedicineSchema = new Schema({
    id: Number,
    name: String,
    price: Number,
    Is_discontinued: Boolean,
    manufacturer_name: String,
    type: String,
    pack_size_label: String,
    short_composition1: String,
    short_composition2: String
},{collection:'medicine'});

// Create a model based on the schema
const Medicine = mongoose.model("Medicine", MedicineSchema,"medicines");

async function findByParams(name, shortComposition1, shortComposition2) {
    try {
        // Trim input strings to remove leading and trailing spaces
        name = name.trim();
        shortComposition1 = shortComposition1.trim();
        shortComposition2 = shortComposition2.trim();
        
        const result = await Medicine.findOne({
            $or: [
                { name: name },
                { short_composition1: shortComposition1 },
                { short_composition2: shortComposition2 }
            ]
        });
        return result;
    } catch (error) {
        throw error;
    }
}
async function findSuggestions(input) {
    try {
        // Perform a query to find suggestions based on the input
        const suggestions = await Medicine.find({
            $or: [
                { name: { $regex: input, $options: 'i' } }, // Case-insensitive search
                { short_composition1: { $regex: input, $options: 'i' } },
                { short_composition2: { $regex: input, $options: 'i' } }
            ]
        }).distinct('name');

        return suggestions;
    } catch (error) {
        throw error;
    }
}


module.exports = { User,findByParams ,findSuggestions,Patient,Prescription};
