const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Team } = require('./src/models');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas (devnexus database)');

        // Clear existing team data
        await Team.deleteMany({});

        // Hash the password helper
        const salt = await bcrypt.genSalt(10);

        const members = [
            {
                name: '𝓐𝓷𝓼𝓱 𝓡𝓪𝓳',
                role: 'Supreme Admin / Founder',
                email: 'ansh@devnexus.com',
                phone: '+91 9876543210',
                isSupremeAdmin: true,
                password: await bcrypt.hash('AnshK23', salt) // Custom: Name + Unique letter + 2 numbers
            },
            {
                name: '𝚂𝚑𝚛𝚒𝚜𝚝𝚞',
                role: 'Senior Developer',
                email: 'sristi@devnexus.com',
                phone: '+91 9811223344',
                password: await bcrypt.hash('SristiX78', salt)
            },
            {
                name: '𝙰𝚗𝚔𝚒𝚝 𝙷𝚊𝚛𝚒𝚟𝚊𝚗𝚜𝚑𝚒',
                role: 'Researcher & Quick Thinker',
                email: 'ankit.h@devnexus.com',
                phone: '+91 8954364894',
                password: await bcrypt.hash('AnkitQ45', salt)
            },
            {
                name: '𝙰𝚋𝚑𝚒𝚜𝚑𝚎𝚔 𝙰𝚊𝚛𝚢𝚊',
                role: 'UI/UX Designer & Expense Manager', // Short name for responsibilities
                email: 'abhishek@devnexus.com',
                phone: '+91 43567486946',
                password: await bcrypt.hash('AbhishekU12', salt)
            },
            {
                name: '𝕽𝖆𝖓𝖏𝖎𝖙 𝕶𝖚𝖘𝖍𝖜𝖆𝖍𝖆',
                role: 'Backend Programmer & AI Creator',
                email: 'ranjit@devnexus.com',
                phone: '+91 9988776655',
                password: await bcrypt.hash('RanjitB99', salt)
            }
        ];

        await Team.insertMany(members);
        console.log('Successfully seeded Supreme Admin and custom team members with personalized hashed passwords');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedUsers();