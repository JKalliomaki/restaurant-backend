const {
  ApolloServer,
  gql,
  } = require('apollo-server')

const mongoose = require('mongoose')
const _ = require('lodash')

const Food = require('./models/Food')
const config = require('./utils/config')
const logger = require('./utils/logger')

mongoose.set('useFindAndModify', false)

logger.info('Connecting to MongoDB')
mongoose.connect(config.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch(e => {
    logger.error(`error connecting to MongoDB: ${e.message}`)
  })
  

const typeDefs = gql`
  type Food {
    name: String!
    category: String!
    diet: [String]
    ingredients: [String]
    ratings: [Int]
  }

  type Query {
    foodCount: Int!
    allFoods: [Food]!
    allCategories: [String]!
  }

  type Mutation {
    addFood(
      name: String!
      category: String!
      diet: [String]
      ingredients: [String]
    ): Food

    rateFood(
      name: String!
      rating: Int!
    ): Food
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
    }
  },
  Mutation: {
    addFood: (root, args) => {
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
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})