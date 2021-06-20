const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async(parent, args, context) => {
            if (!context.user) {
                throw new AuthenticationError('Sorry, not logged in');
            }
            return await User.findOne({ _id: context.user._id }).select('-__v -password');
        },
    },
    Mutation: {
        addUser: async(parent, args) => {
            const newUser = await User.create(args);
            const token = signToken(newUser);
            return { token, newUser };
        },
        login: async(parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Unable to find user');
            }

            const validPassword = await user.isCorrectPassword(password);

            if (!validPassword) {
                throw new AuthenticationError('Incorrect password');
            }

            const token = signToken(user);
            return { token, user };
        },
        saveBook: async(parent, { input }, context) => {
            if (!context.user) {
                throw new AuthenticationError('Sorry, you are not logged in');
            }

            return await User.findByIdAndUpdate({ _id: context.user._id }, { $addToSet: { savedBooks: input } }, { new: true });
        },
        removeBook: async(parent, { bookId }, context) => {
            if (!context.user) {
                throw new AuthenticationError('Sorry, you are not logged in');
            }
            return await User.findOneAndUpdate({ _id: context.user._id }, { $pull: { savedBooks: { bookId } } }, { new: true });
        }
    }
};

module.exports = resolvers;