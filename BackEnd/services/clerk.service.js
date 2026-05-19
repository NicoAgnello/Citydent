const User = require('../models/user');

const upsertUser = async ({ clerkId, email, firstName, lastName }) => {
  const existingUser = await User.findOne({ email });

  const role = existingUser?.role ?? 'user';

  return await User.findOneAndUpdate(
    { email },
    { $set: { clerkId, email, firstName, lastName, role } },
    { upsert: true, returnDocument: 'after' }
  );
};

module.exports = { upsertUser };