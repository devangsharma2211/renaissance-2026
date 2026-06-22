import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/renaissance';

async function run() {
  console.log('Connecting to', MONGO);
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

  const db = mongoose.connection.db;
  const collName = 'outsiderpasses';

  try {
    const coll = db.collection(collName);

    // List indexes
    const indexes = await coll.indexes();
    console.log('Existing indexes:', indexes.map(i => ({ name: i.name, key: i.key, sparse: i.sparse })));

    // Check if there's an existing qrToken index that's not sparse
    const qrIndex = indexes.find(i => i.key && i.key.qrToken === 1);

    if (qrIndex) {
      if (!qrIndex.sparse) {
        console.log('Found non-sparse qrToken index (name=' + qrIndex.name + '). Dropping...');
        await coll.dropIndex(qrIndex.name);
        console.log('Dropped index', qrIndex.name);
      } else {
        console.log('qrToken index already sparse - nothing to drop');
      }
    } else {
      console.log('No existing qrToken index found');
    }

    // Ensure final index exists (sparse + unique)
    console.log('Creating index { qrToken: 1 } unique:true, sparse:true');
    await coll.createIndex({ qrToken: 1 }, { unique: true, sparse: true, background: true });
    console.log('Index created/ensured successfully');

  } catch (err) {
    console.error('Error while fixing outsider index:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Done');
  }
}

run();
