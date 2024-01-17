const MongoClient = require('mongodb').MongoClient;

// Connection URI
const uri = 'mongodb://localhost:27017';

async function performTransaction(senderId, recipientId, amount) {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Start a session
    const session = client.startSession();
    session.startTransaction();

    try {
      // Perform operations within the transaction
      const database = client.db('bank');
      const accountsCollection = database.collection('accounts');
      const transactionsCollection = database.collection('transactions');

      // Step 1: Retrieve sender and recipient accounts
      const senderAccount = await accountsCollection.findOne({ _id: senderId }, { session });
      const recipientAccount = await accountsCollection.findOne({ _id: recipientId }, { session });

      // Step 2: Check if sender has enough balance
      if (!senderAccount || senderAccount.balance < amount) {
        throw new Error('Insufficient balance for the transaction.');
      }

      // Step 3: Update sender and recipient balances
      await accountsCollection.updateOne({ _id: senderId }, { $inc: { balance: -amount } }, { session });
      await accountsCollection.updateOne({ _id: recipientId }, { $inc: { balance: amount } }, { session });

      // Step 4: Record the transaction details
      const transaction = {
        senderId,
        recipientId,
        amount,
        timestamp: new Date(),
      };
      await transactionsCollection.insertOne(transaction, { session });

      // Commit the transaction
      await session.commitTransaction();
      console.log('Transaction committed');
    } catch (error) {
      // Abort the transaction in case of an error
      await session.abortTransaction();
      console.error('Transaction aborted:', error.message);
    } finally {
      // End the session
      session.endSession();
    }
  } finally {
    // Close the connection
    await client.close();
    console.log('Connection closed');
  }
}

// Example: Transfer $50 from account with _id=1 to account with _id=2
performTransaction(1, 2, 50);
