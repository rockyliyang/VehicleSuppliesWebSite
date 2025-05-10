const bcrypt = require('bcryptjs');

async function generateHash(password) {
    try {
        const hash = await bcrypt.hash(password, 10);
        console.log('Password:', password);
        console.log('Hash:', hash);
        return hash;
    } catch (error) {
        console.error('Error generating hash:', error);
    }
}

// 从命令行参数获取密码
const password = process.argv[2];
if (!password) {
    console.log('Please provide a password as argument');
    console.log('Usage: node generateHash.js <password>');
    process.exit(1);
}

generateHash(password); 