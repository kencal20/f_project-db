const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());
const JWT_SECRET = "lsajdlsakdjasdjP'ADSOJS;LKDJSLAKJDALSKDJ;ASkdjls;kdjiouudwe0wq5e\
6q87623867as6"

const mongoUrl = "mongodb+srv://kenadjei20:HsQpZUBDFNPeerGb@cluster0.cpru3r4.mongodb.net/dbcproject";

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to database');
  })
  .catch(e => {
    console.error('Error connecting to database:', e);
  });
const UserDetailsSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  email: { type: String, unique: true },
  password: String,
  userType: String
}, {
  collection: "User",
});

const User = mongoose.model("User", UserDetailsSchema);

const CompanyDetailsSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  email: { type: String, unique: true },
  password: String,
  userType: String
}, {
  collection: "Company",
});

const Company = mongoose.model("CompanyInfo", CompanyDetailsSchema);


const SuperUserSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  email: { type: String, unique: true },
  password: String,
  userType: String
}, {
  collection: "SuperUser",
});
const SuperUser = mongoose.model("SuperUser", SuperUserSchema);



//api's concerning both user and company
app.post("/register", async (req, res) => {
  const { fname, lname, email, password, userType } = req.body;

  const encryptedPassword = await bcrypt.hash(password, 10);

  try {
    const olduser = User.findOne({ email });

    if (userType === "user" || userType === "Company") {
      const Model = userType === "user" ? User : Company;

      await Model.create({
        fname,
        lname,
        email,
        password: encryptedPassword,
        userType,
      });

      return res.status(201).json({ message: 'Account created successfully' });
    } else {
      return res.status(400).json({ error: "Invalid userType" });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'An error occurred while registering' });
  }
});


app.post('/login', async (req, res) => {
  const { email, password, userType } = req.body;

  // Define the models for both User and Company
  const userModel = userType === 'company' ? Company : User;

  try {
    // Search for the user in the appropriate schema
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ error: 'User not found' });
    }

    // Compare the password
    if (await bcrypt.compare(password, user.password)) {
      // Generate a token
      const token = jwt.sign({ email: user.email, userType }, JWT_SECRET, {
        expiresIn: '1h', // Adjust the token expiration time as needed
      });

      res.json({ status: 'ok', data: token });
    } else {
      return res.json({ error: 'Invalid Password' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while logging in' });
  }
});


//api's concerning user
app.post("/userData", async (req, res) => {
  const { token } = req.body;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    const userType = user.userType;

    if (userType === "user") {
      // Fetch user information
      const userData = await User.findOne({ email: useremail });

      if (userData) {
        res.json({ status: 'ok', data: userData });
      } else {
        res.json({ status: 'error', data: null });
      }
    } else {
      res.json({ status: 'error', data: null, error: 'Invalid userType' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', data: null });
  }
});

app.post("/updateUser", async (req, res) => {
  const { id, fname, lname } = req.body;

  try {

    const user = await User.findByIdAndUpdate(id, {
      fname,
      lname,
    });

    if (!user) {
      return res.status(404).json({ status: 'error', data: 'User not found' });
    }

    return res.json({ status: 'ok', data: 'User updated' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', data: 'An error occurred while updating the user' });
  }
});

//api's concerning company
app.post("/companyData", async (req, res) => {
  const { token } = req.body;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;

    const companyData = await Company.findOne({ email: useremail });

    if (companyData) {
      res.json({ status: 'ok', data: companyData });
    } else {
      res.json({ status: 'error', data: null });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', data: null });
  }
});


app.post("/updateCompany", async (req, res) => {
  const { id, fname, lname } = req.body;
  try {
    await Company.updateOne({ _id: id }, {
      $set: {
        fname: fname,
        lname: lname
      }
    });
    return res.json({ status: "ok", data: "Company updated" });
  } catch (error) {
    return res.json({ status: "error", data: error });
  }
});

// api's concerning super User
app.get("/getAllData", async (req, res) => {
  try {
    const allUsers = await User.find({});
    const allCompanies = await Company.find({});
    const data = {
      users: allUsers,
      companies: allCompanies,
    };
    res.send({ status: "ok", data });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "error", error: "An error occurred while fetching data" });
  }
});


app.delete("/deleteUser/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await User.deleteOne({ _id: userId });
    if (result.deletedCount === 1) {
      res.json({ status: "ok", data: "Deleted" });
    } else {
      res.status(404).json({ status: "error", error: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", error: "An error occurred while deleting" });
  }

});


app.delete("/deleteCompany/:id", async (req, res) => {
  const companyId = req.params.id;

  try {
    const result = await Company.deleteOne({ _id: companyId });
    if (result.deletedCount === 1) {
      res.json({ status: "ok", data: "Deleted" });
    } else {
      res.status(404).json({ status: "error", error: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", error: "An error occurred while deleting" });
  }

});


app.post('/createSuperUser', async (req, res) => {
  const { fname, lname, email, password } = req.body;

  try {
    const existingUser = await SuperUser.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'SuperUser with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const superUser = new SuperUser({
      fname,
      lname,
      email,
      password: hashedPassword,
      userType: 'superuser',
    });

    await superUser.save();

    return res.status(201).json({ message: 'SuperUser created successfully' });
  } catch (error) {
    console.error('Error creating super user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/superUser/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Search for the super user in the SuperUser schema
    const superUser = await SuperUser.findOne({ email });
    if (!superUser) {
      return res.json({ error: 'Super User not found' });
    }

    // Compare the hashed password
    const passwordMatch = await bcrypt.compare(password, superUser.password);

    if (passwordMatch) {
      // Passwords match, generate a token
      const token = jwt.sign({ email: superUser.email, userType: 'superuser' }, JWT_SECRET, {
        expiresIn: '1h', // Adjust the token expiration time as needed
      });

      res.json({ status: 'ok', data: token });
    } else {
      return res.json({ error: 'Invalid Password' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while logging in' });
  }
});


app.post("/superUserData", async (req, res) => {
  const { token } = req.body;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;

    const superUserData = await SuperUser.findOne({ email: useremail });

    if (superUserData) {
      res.json({ status: 'ok', data: superUserData });
    } else {
      res.json({ status: 'error', data: null });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', data: null });
  }
});







const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});