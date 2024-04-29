const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const bodyParser = require("body-parser");
const {User,findByParams,findSuggestions,Patient,Prescription} = require("./mongodb"); // Import functions from mongodb.js
const mongodb = require("./mongodb")
const methodOverride = require('method-override');
const session = require('express-session');
const crypto = require('crypto');
const { sync } = require("random-bytes");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Generate a secure secret key
const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Generated secret key:', secretKey);

// Configure express-session middleware
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true
}));
let docname;
// Use method-override middleware
app.use(methodOverride('_method'));

// Routes
app.get('/home', (req, res) => {
    res.render("index.ejs",{result1:[],docname:docname});
});

app.get('/', (req, res) => {
    res.render("login.ejs");
});
app.get('/ex_patient', (req, res) => {
    res.render("ex_patient.ejs",{data:[],result:[],docname:docname});
});

app.get('/register', (req, res) => {
    res.render("register.ejs");
});
app.get('/submit_enrollment',(req,res)=>{
    res.render("form.ejs",{docname:docname});
});
// app.get('/ex_patient',(req,res)=>{
//      res.render("ex_patient.ejs",{result:[]});
// });

// Route for logout (DELETE request)
app.delete('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.redirect('/');
        }
    });
});

// POST route for registering a new user
app.post("/register", async (req, res) => {
    const { name,email, password, confirmPassword } = req.body;

    // Check if password and confirm password match
    if (password !== confirmPassword) {
        return res.status(400).send("Passwords do not match");
    }

    try {
        // Create a new user using the User model
        const newUser = new User({
            name:name,
            email:email,
            password:password
        });

        // Save the new user to the database
        await newUser.save();

        // Redirect to login page after successful registration
        res.redirect('/');
    } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).send("Internal Server Error");
    }
});

// POST route for user login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(password);
    try {
        // Find user by email
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).send("User not found");
        }
         docname = user.name;
        console.log(docname);
        console.log("Its the DoC name");
        // Check if password matches
        if (user.password === password) {
            res.redirect('/home'); // Redirect to home page with docname as query parameter
        } else {
            res.send("Wrong Password");
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/pinfo", async (req, res) => {
    const patientQuery = req.query.patientQuery;
    try {
        const data = await Patient.findOne({AdharNo:patientQuery});
      //  const data2 = await Prescription.find({ AdharNo: patientQuery });
       
        if (!data) {
            // If no patient data is found, return an error message
            return res.status(404).json({ message: 'Patient not found' });
        }
        // If patient data is found, send it as JSON response
        res.status(200).json({ data:data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.get("/prinfo", async (req, res) => {
    const patientQuery = req.query.patientQuery;
    console.log("Patient Query:", patientQuery); // Logging the patient query

    try {
        const data2 = await Prescription.find({ adharnum: patientQuery });
        console.log("Data from MongoDB:", data2); // Logging the data retrieved from MongoDB

        if (data2.length === 0) {
            // If no patient data is found, return an error message
            console.log("No patient data found");
            return res.status(404).json({ message: 'Patient not found' });
        }
        // If patient data is found, send it as JSON response
        console.log("Patient data found:", data2);
        res.status(200).json({ data2: data2 });
    } catch (err) {
        console.error("Error:", err); // Logging any errors that occur
        res.status(500).json({ message: 'Server Error' });
    }
});





app.post('/search', async (req, res) => {
    try {
        console.log('Request body:', req.body); // Debugging: Log the request body

        const { searchQuery } = req.body;

        if (!searchQuery) {
            console.error('Search query is empty or undefined.');
            return res.status(400).send('Search query is empty or undefined.');
        }

        // Split the search query into individual search parameters
        const searchParams = searchQuery.trim().split(' ');

        // Extract search parameters
        const name = searchParams.join(' '); // Search by name
        const shortComposition1 = searchParams.join(' '); // Search by short composition 1
        const shortComposition2 = searchParams.join(' '); // Search by short composition 2

        // Perform the search across multiple fields using imported function
        const result1 = await findByParams(name, shortComposition1, shortComposition2);

        res.render("index", { result1:result1,docname:docname});
    } catch (error) {
        console.error("Error searching data:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.use(bodyParser.json());
app.post('/search_2', async (req, res) => {
    try {
        console.log('Request body:', req.body.searchQuery); // Debugging: Log the request body

        const searchQuery = req.body.searchQuery;

        if (!searchQuery) {
            console.error('Search query is empty or undefined.');
            return res.status(400).send('Search query is empty or undefined.');
        }

        // Split the search query into individual search parameters
        const searchParams = searchQuery.trim().split(' ');

        // Extract search parameters
        const name = searchParams.join(' '); // Search by name
        const shortComposition1 = searchParams.join(' '); // Search by short composition 1
        const shortComposition2 = searchParams.join(' '); // Search by short composition 2

        // Perform the search across multiple fields using imported function
        const result = await findByParams(name, shortComposition1, shortComposition2);
       // console.log(result);
        if (!result) {
            // If no patient data is found, return an error message
            return res.status(404).json({ message: 'Patient not found' });
        }
        // If patient data is found, send it as JSON response
        res.status(200).json({ result:result });
    
        //res.render("ex_patient", { result: result ,data:[]}); // Render for ex_patient page as well
    } catch (error) {
        console.error("Error searching data:", error);
        res.status(500).send("Internal Server Error");
    }
});




app.get('/suggestions', async (req, res) => {
    try {
        const { input } = req.query;

        // Perform a query to find suggestions based on the input using imported function
        const suggestions = await mongodb.findSuggestions(input);

        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/submit_enrollment", async (req, res) => {
    const {
        firstName,
        lastName,
        dob,
        sex,
        height,
        weight,
        maritalStatus,
        contactNumber,
        email,
        emergencyNumber,
        adharNo
    } = req.body;



    try {
        // Create a new user using the User model
        const newUser = new Patient({

            FirstName:firstName,
            lastName:lastName,
            DOB:dob,
            Sex:sex,
            Height:height,
            Weight:weight,
            MaritialStatus:maritalStatus,
            ContactNumber:contactNumber,
            Email:email,
            EmergencyNumber:emergencyNumber,
            AdharNo:adharNo,
 
        });

        // Save the new user to the database
        await newUser.save();

        // Redirect to login page after successful registration
        res.redirect('/ex_patient');
    } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).send("Internal Server Error");
    }
});



// Define the route to handle POST requests
app.post('/prescriptions', async (req, res) => {
    try {
      // Extract data from request body
      const {name,adharnum,medicines, review, medicalRequirements } = req.body;
  
      // Create a new Prescription instance
      const newPrescription = new Prescription({
        name,
        adharnum,
        medicines,
        review,
        medicalRequirements,
      });
  
      // Save the new prescription to the database
      await newPrescription.save();
      //console.log(adharnum);
      console.log("Prescription is uploaded");
  
      res.status(201).json({ message: 'Prescription created successfully' });
    } catch (error) {
      console.error('Error saving prescription:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });


app.listen(port, () => console.log(`Yeaaahhhhh you app is running and listening on port ${port}!`));
