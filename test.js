const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quartier-connect', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connexion MongoDB réussie!'))
.catch(err => console.error('❌ Erreur de connexion MongoDB:', err));
