const {
  ApolloServer,
  gql,
  AuthenticationError,
  } = require('apollo-server')

const mongoose = require('mongoose')
const _ = require('lodash')

const Food = require('./models/Food')
const User = require('./models/User')
const config = require('./utils/config')
const logger = require('./utils/logger')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

mongoose.set('useFindAndModify', false)

logger.info('Connecting to MongoDB')
mongoose.connect(config.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch(e => {
    logger.error(`error connecting to MongoDB: ${e.message}`)
  })
  
const USER_ROLES = {
  owner: 5,
  coOwner: 4,
  chef: 3,
  waiter: 2,
}


const typeDefs = gql`
  type Food {
    name: String!
    price: Float!
    category: String!
    diet: [String]
    ingredients: [String]
    ratings: [Int]
  }

  type User {
    username: String!
    role: Int!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    foodCount: Int!
    allFoods: [Food]!
    allCategories: [String]!
    foodsByCategory(category: String!): [Food]!
    me: User
  }

  type Mutation {
    addFood(
      name: String!
      price: Float!
      category: String!
      diet: [String]
      ingredients: [String]
    ): Food

    rateFood(
      name: String!
      rating: Int!
    ): Food

    createUser(
      username: String!
      password: String!
      role: Int!
    ): User

    login(
      username: String!
      password: String!
    ): Token
  }

`


const resolvers = {
  Query: {
    foodCount: () => Food.collection.countDocuments(),
    allFoods: () => Food.find({}),
    allCategories: async () => {
      const foods = await Food.find({})
      const uniqs = _.uniq(foods.map(food => food.category))
      return uniqs
    },
    foodsByCategory: async (root, args) => {
      const foods = await Food.find({category: args.category})
      return foods
    },
    me: (root, args, context) => {
      return context.currentUser
    }
  },
  Mutation: {
    addFood: (root, args, context) => {
      if (!context.currentUser || context.currentUser.role < USER_ROLES.chef){
        throw new AuthenticationError('Unauthorized')
      }

      if (!args.diet) {
        args = {...args, diet: []}
      }
      if (!args.ingredients){
        args = {...args, ingredients: []}
      }
      const newFood = new Food({...args, ratings: []})
      return newFood.save()
    },

    rateFood: async (root, args) => {
      const food = await Food.findOne({name: args.name})
      food.ratings.push(args.rating)
      return food.save()
    },

    createUser: async (root, args, context) => {
      if (!context.currentUser || context.currentUser.role !== USER_ROLES.owner){
        throw new AuthenticationError('Unauthorized')
      }

      const passwordHash = await bcrypt.hash(args.password, 10)

      const newUser = new User({
        username: args.username,
        role: args.role,
        passwordHash,
      })

      return newUser.save()
    },

    login: async (root, args) => {
      const user = await User.findOne({username: args.username})

      const passwordCorrect = user === null 
      ? false
      : await bcrypt.compare(args.password, user.passwordHash)

      if (passwordCorrect){
        logger.info(`${user.username} logged in`)
        const userToLog = {
          username: user.username,
          id: user._id
        }
        const token = await jwt.sign(userToLog, config.JWT_SECRET)
        return {value: token}

      } else {
        throw new AuthenticationError('invalid credentials')
      }
      
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({req}) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')){
      const decodedToken = jwt.verify(
        auth.substring(7), config.JWT_SECRET
      )
      const currentUser = await User
        .findById(decodedToken.id)
      return {currentUser}
    }
  }
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})