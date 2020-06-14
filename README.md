# Restaurant web-app
This app consists back-end, and a build of front-end of a web app that gives a working front-page and a dashboard where you can edit menu and create and view orders from each table in restaurant. Items in the app is stored in MongoDB.

## Preview
You can preview the front-page of the app in [Heroku](https://dry-plateau-91084.herokuapp.com/) and the [dashboard](https://dry-plateau-91084.herokuapp.com/dashboard) where you can edit menu, handle orders and create new accounts(not with user you are getting access to from here) for the restaurant. So you can login to the dashboard with username 'waiter' and password 'sekred' to take a peek at the dashboard.

## Dependencies
### Front-end
Repository for the front-end can be found [here](https://github.com/JKalliomaki/restaurant-frontend)
* [React](https://reactjs.org/) with 'react-dom'
* [react-dropdown-select](https://github.com/sanusart/react-dropdown-select)
* [react-spinners](https://github.com/davidhu2000/react-spinners)
* [styled-components](https://styled-components.com/)
* [Apollo](https://www.apollographql.com/)
* [apollo-link-context](https://www.apollographql.com/docs/link/links/context/)
* [graphql](https://graphql.org/)

### Back-end
* [aopllo-server](https://github.com/apollographql/apollo-server)
* [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
* [express](https://expressjs.com/)
* [express-graphql](https://github.com/graphql/express-graphql)
* [graphql](https://graphql.org/)
* [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
* [lodash](https://lodash.com/)
* [mongoose](https://mongoosejs.com/)

## To-do

* tests
* nicer UI for frontpage