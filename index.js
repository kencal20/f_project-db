const express = require('express');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = "lsajdlsakdjasdjP'ADSOJS;LKDJSLAKJDALSKDJ;ASkdjls;kdjiouudwe0wq5e6q87623867as6";

const sequelize = new Sequelize('finalProject', 'kencal20', '@Adjetey@2001', {
    dialect: 'mysql',
    host: 'localhost'
});

const User = sequelize.define('User', {
    fname: Sequelize.STRING,
    lname: Sequelize.STRING,
    email: { type: Sequelize.STRING, unique: true },
    password: Sequelize.STRING,
    userType: Sequelize.STRING,
});

const Company = sequelize.define('Company', {
    fname: Sequelize.STRING,
    lname: Sequelize.STRING,
    email: { type: Sequelize.STRING, unique: true },
    password: Sequelize.STRING,
    userType: Sequelize.STRING,
    companyName: Sequelize.STRING,
});

sequelize.sync();

app.post("/register", async (req, res) => {
    const { fname, lname, email, password, userType, companyName } = req.body;

    const encryptedPassword = await bcrypt.hash(password, 10);

    try {
        console.log('Received registration request with data:', req.body);

        // Convert userType to lowercase here
        const lowerCaseUserType = userType.toLowerCase();
        console.log('Lowercase UserType:', lowerCaseUserType);
        if (lowerCaseUserType === "user") {
            const user = await User.create({
                fname,
                lname,
                email,
                password: encryptedPassword,
                userType: lowerCaseUserType,
            });

            console.log(`User registered successfully with email: ${email}`);
            return res.status(201).json({ message: 'User account created successfully' });
        } else if (lowerCaseUserType === "company") {
            const company = await Company.create({
                fname,
                lname,
                email,
                password: encryptedPassword,
                userType: lowerCaseUserType,
                companyName,
            });

            console.log(`Company registered successfully with email: ${email}`);
            return res.status(201).json({ message: 'Company account created successfully' });
        } else {
            console.log(`Invalid userType: ${userType}`);
            return res.status(400).json({ error: "Invalid userType" });
        }

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            // Handle unique constraint violation
            console.error('Email address already exists:', error.errors);
            return res.status(400).json({ error: 'Email address already exists' });
        }
        // Handle other errors
        console.error('Error during registration:', error.message);
        return res.status(500).json({ error: 'An error occurred while registering' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password, userType } = req.body;

    const userModel = userType === 'company' ? Company : User;

    try {
        const user = await userModel.findOne({ where: { email } });
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }

        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ email: user.email, userType: user.userType }, JWT_SECRET, {
                expiresIn: '1h',
            });

            res.json({ success: true, data: { token, user: { email: user.email, userType: user.userType } } });
        } else {
            return res.json({ success: false, error: 'Invalid Password' });
        }
    } catch (error) {
        console.error('Unexpected error during login:', error);
        return res.status(500).json({ success: false, error: 'An unexpected error occurred while logging in' });
    }
});

app.post("/userData", async (req, res) => {
    const { token } = req.body;

    try {
        const user = jwt.verify(token, JWT_SECRET);
        const useremail = user.email;
        const userType = user.userType;

        if (userType === "user") {
            const userData = await User.findOne({ where: { email: useremail } });

            if (userData) {
                res.status(200).json({ status: 'ok', data: userData });
            } else {
                res.status(404).json({ status: 'error', data: null, error: 'User not found' });
            }
        } else {
            res.status(400).json({ status: 'error', data: null, error: 'Invalid userType' });
        }
    } catch (error) {
        console.error(error);
    }
})

app.post("/companyData", async (req, res) => {
    const { token } = req.body;

    try {
        const user = jwt.verify(token, JWT_SECRET);
        const useremail = user.email;

        const companyData = await Company.findOne({ where: { email: useremail } });

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

app.post("/updateUser", async (req, res) => {
    const { id, fname, lname, email, newPassword } = req.body;

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ status: 'error', data: 'User not found' });
        }

        // Check if the newPassword is provided
        if (newPassword) {
            const encryptedPassword = await bcrypt.hash(newPassword, 10);
            user.password = encryptedPassword;
        }

        // Update other fields
        user.fname = fname;
        user.lname = lname;
        user.email = email;

        await user.save();

        return res.json({ status: 'ok', data: 'User updated' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', data: 'An error occurred while updating the user' });
    }
});

app.post("/updateCompany", async (req, res) => {
    const { id, fname, lname, companyName, email, newPassword } = req.body;

    try {
        const company = await Company.findByPk(id);

        if (!company) {
            return res.status(404).json({ status: 'error', data: 'Company not found' });
        }

        // Check if the newPassword is provided
        if (newPassword) {
            const encryptedPassword = await bcrypt.hash(newPassword, 10);
            company.password = encryptedPassword;
        }

        // Update other fields
        company.fname = fname;
        company.lname = lname;
        company.companyName = companyName;
        company.email = email;

        await company.save();

        return res.json({ status: 'ok', data: 'Company updated' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', data: 'An error occurred while updating the company' });
    }
});


const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

