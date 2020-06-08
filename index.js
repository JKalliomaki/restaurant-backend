const {
  ApolloServer,
  gql,
  AuthenticationError,
} = require('apollo-server')

const path = require('path')
const bodyParser = require('body-parser')

const { makeExecutableSchema } = require('graphql-tools')

const graphqlHTTP = require('express-graphql')
const express = require('express')
const app = express()
app.use(express.json())
app.use(express.static('build'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const expressPlayground = require('graphql-playground-middleware-express')
  .default


const mongoose = require('mongoose')
const _ = require('lodash')

const Food = require('./models/Food')
const User = require('./models/User')
const Order = require('./models/Order')
const config = require('./utils/config')
const logger = require('./utils/logger')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const FOOD_CATEGORIES = [
  'starter',
  'main course',
  'dessert'
]

mongoose.set('useFindAndModify', false)

logger.info('Connecting to MongoDB')
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  useCreateIndex: true
})
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
Object.freeze(USER_ROLES)


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

  type Order {
    waiter: User!
    tableNr: Int!
    items: [String]!
    id: ID!
  }

  type Query {
    foodCount: Int!
    allFoods: [Food]!
    allCategories: [String]!
    foodsByCategory(category: String!): [Food]!
    allOrders: [Order]!
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

    editFood(
      name: String!
      price: Float!
      category: String!
      diet: [String]
      ingredients: [String]
    ): Food

    removeFood(
      name: String!
    ): Food

    rateFood(
      name: String!
      rating: Int!
    ): Food

    createOrder(
      tableNr: Int!
      items: [String!]!
    ): Order

    removeOrder(
      id: ID!
    ): Order

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
    allCategories: () => {
      return FOOD_CATEGORIES
    },
    foodsByCategory: async (root, args) => {
      const foods = await Food.find({category: args.category})
      return foods
    },
    allOrders: async () => {
      const orders = await Order.find({})
        .populate('waiter')
      return orders
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
    editFood: async (root, args, context) => {
      if (!context.currentUser || context.currentUser.role < USER_ROLES.chef){
        throw new AuthenticationError('Unauthorized')
      }
      const editedFood = {
        ...args
      }
      return await Food.findOneAndUpdate({name: args.name}, editedFood, {new: true})
    },

    removeFood: async (root, args, context) => {
      if (!context.currentUser || context.currentUser.role < USER_ROLES.chef){
        throw new AuthenticationError('Unauthorized')
      }
      return await Food.findOneAndRemove({name: args.name})
    },

    rateFood: async (root, args) => {
      const food = await Food.findOne({name: args.name})
      food.ratings.push(args.rating)
      return food.save()
    },

    createOrder: async (root, args, context) => {
      if (!context.currentUser){
        throw new AuthenticationError('Unauthorized')
      }
      const userId = context.currentUser.id
      let items = []
      for (const item of args.items){
        const foodToAdd = await Food.findOne({name: item})
        if(foodToAdd){
          items.push(foodToAdd.name)
        }
      }

      let order = await new Order({...args, waiter: userId, items: items})
      order = await order.populate('waiter').execPopulate()
      logger.info(order)
      return await order.save()
    },

    removeOrder: async (root, args) => {
      return await Order.findByIdAndRemove(args.id)
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

const contextFunc = async (req) => {
  const auth = req ? req.headers.authorization : null
  if (auth && auth.toLowerCase().startsWith('bearer ')){
    const decodedToken = jwt.verify(
      auth.substring(7), config.JWT_SECRET
    )
    const currentUser = await User
      .findById(decodedToken.id)
    return {
      username: currentUser.username,
      role: currentUser.role,
      id: currentUser.id,
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  playground: true,
})

app.use('/graphql', graphqlHTTP(async (req) => {
  const context = await contextFunc(req)
  const returnObject = {
    schema,
    graphiql: true,
    context: {
      currentUser: context
    }
  }
  return {...returnObject}
}))
  

app.get('/playground', expressPlayground({endpoint: '/graphql'}))
app.get('*', (req, res) => res.sendFile(path.join(__dirname+'/build/index.html')))

const port = process.env.PORT || '4000'

app.listen(port)
console.log(`server ready at port ${port}`)
