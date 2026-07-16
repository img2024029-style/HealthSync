require('dotenv').config();
const User = require('./src/models/User');
const Hospital = require('./src/models/Hospital');
const email = 'ayushpratapsingh99990@gmail.com';
async function verify() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');
        const userRes = await User.updateOne({ email }, { $set: { isVerified: true } });
        console.log('User update status:', userRes);
        const hospitalRes = await Hospital.updateOne({ email }, { $set: { isVerified: true } });
        console.log('Hospital update status:', hospitalRes);
        console.log('Verification completed successfully!');
    } catch (err) {
        console.error('Error performing verification:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}
verify();
