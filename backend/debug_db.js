require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');

async function testConnection() {
    try {
        console.log('Testing DB and Auth Logic...');
        await sequelize.authenticate();
        
        const email = 'sadiabadji9@gmail.com';
        const user = await User.findOne({ where: { email } });
        
        if (user) {
             const match = await bcrypt.compare('wrongpassword', user.password);
             console.log('Bcrypt check (false):', match);
             jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
             console.log('JWT sign check: OK');
        } else {
            console.log('User not found (skipping internal logic checks)');
        }

        console.log('\nTesting HTTP Login Endpoint...');
        const postData = JSON.stringify({
            email: 'sadiabadji9@gmail.com',
            password: 'wrongpassword'
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log('BODY:', data);
                process.exit(0);
            });
        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            process.exit(1);
        });

        req.write(postData);
        req.end();

    } catch (error) {
        console.error('CRITICAL FAILURE:', error);
        process.exit(1);
    }
}

testConnection();
